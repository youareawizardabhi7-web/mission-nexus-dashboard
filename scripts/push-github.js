import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

// ANSI coloring helpers
const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function print(msg, color = COLORS.reset) {
  console.log(`${color}${msg}${COLORS.reset}`);
}

const rl = readline.createInterface({ input, output });

async function ask(query, defaultValue = '') {
  const displayQuery = defaultValue ? `${query}[${defaultValue}] ` : query;
  const answer = await rl.question(displayQuery);
  return answer.trim() || defaultValue;
}

async function askYesNo(query, defaultYes = true) {
  const suffix = defaultYes ? '(Y/n)' : '(y/N)';
  const answer = (await ask(`${query} ${suffix}: `)).toLowerCase();
  if (!answer) return defaultYes;
  return answer === 'y' || answer === 'yes';
}

async function selectOption(promptMessage, options) {
  print(`\n${promptMessage}`, COLORS.bold + COLORS.cyan);
  options.forEach((opt, idx) => {
    print(`  ${idx + 1}) ${opt}`);
  });
  while (true) {
    const answer = await ask('Enter choice: ');
    const num = parseInt(answer, 10);
    if (!isNaN(num) && num >= 1 && num <= options.length) {
      return num - 1;
    }
    print(`❌ Invalid choice. Please enter a number between 1 and ${options.length}.`, COLORS.red);
  }
}

// Check if command is available
function cmdExists(cmd) {
  try {
    execSync(`${cmd} --version`, { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

// Run synchronous git commands
function runGit(args, options = {}) {
  try {
    const result = execSync(`git ${args.join(' ')}`, { encoding: 'utf8', ...options });
    return { success: true, output: result.trim() };
  } catch (err) {
    return { success: false, error: err.message, stderr: err.stderr ? err.stderr.toString().trim() : '' };
  }
}

// Run git commands with live stdout/stderr stream
function spawnGit(args) {
  return new Promise((resolve) => {
    const child = spawn('git', args, { stdio: 'inherit' });
    child.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

// Parse repository owner and name from a git remote URL
function parseRepoFromUrl(url) {
  // Matches git@github.com:owner/repo.git or https://github.com/owner/repo.git
  const match = url.match(/github\.com[:\/]([^\/]+\/[^\/\.]+)(?:\.git)?$/);
  return match ? match[1] : null;
}

// Main execution function
async function main() {
  print('==================================================', COLORS.blue);
  print('🚀   MULTI-ACCOUNT GITHUB PUSH UTILITY', COLORS.bold + COLORS.green);
  print('==================================================\n', COLORS.blue);

  // 1. Verify Git installation
  if (!cmdExists('git')) {
    print('❌ Git is not installed or not in your PATH. Please install Git first.', COLORS.red);
    process.exit(1);
  }

  // 2. Check if git repository is initialized
  let isGitRepo = runGit(['rev-parse', '--is-inside-work-tree']).success;
  if (!isGitRepo) {
    print('ℹ️ Current directory is not a Git repository.', COLORS.yellow);
    const initRepo = await askYesNo('Would you like to initialize a new Git repository here?', true);
    if (!initRepo) {
      print('Exiting.', COLORS.yellow);
      process.exit(0);
    }
    const initRes = runGit(['init']);
    if (!initRes.success) {
      print(`❌ Failed to initialize Git repository: ${initRes.error}`, COLORS.red);
      process.exit(1);
    }
    print('✅ Initialized empty Git repository.', COLORS.green);
  }

  // 3. Check for uncommitted changes
  const statusRes = runGit(['status', '--porcelain']);
  if (statusRes.success && statusRes.output) {
    print('\n⚠️ You have uncommitted changes in your workspace:', COLORS.yellow);
    // Display preview of modified/untracked files
    console.log(statusRes.output);

    const choice = await selectOption('What would you like to do with these changes?', [
      'Stage and commit all changes now',
      'Push only previously committed changes',
      'Cancel and exit'
    ]);

    if (choice === 2) {
      print('Cancelled by user.', COLORS.yellow);
      process.exit(0);
    } else if (choice === 0) {
      const commitMsg = await ask('Enter commit message: ', 'Update project');
      print('Staging changes...', COLORS.cyan);
      runGit(['add', '.']);
      print('Committing...', COLORS.cyan);
      const commitRes = runGit(['commit', '-m', `"${commitMsg.replace(/"/g, '\\"')}"`]);
      if (commitRes.success) {
        print('✅ Changes committed successfully.', COLORS.green);
      } else {
        print(`❌ Failed to commit: ${commitRes.stderr || commitRes.error}`, COLORS.red);
        process.exit(1);
      }
    }
  }

  // 4. Retrieve current branch
  let branch = runGit(['branch', '--show-current']).output;
  if (!branch) {
    // If no commits exist yet, show-current might be empty, default to master
    branch = 'master';
  }

  // 5. Load accounts/profiles configuration
  const profilesDir = os.homedir();
  const profilesPath = path.join(profilesDir, '.git-profiles.json');
  let config = { profiles: [] };

  if (fs.existsSync(profilesPath)) {
    try {
      config = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
    } catch (e) {
      print(`⚠️ Error reading ~/.git-profiles.json. Resetting config.`, COLORS.yellow);
    }
  }

  if (!config.profiles) {
    config.profiles = [];
  }

  // Define account creation flow
  const createProfile = async () => {
    print('\n➕ Create New GitHub Profile', COLORS.bold + COLORS.cyan);
    const name = await ask('Profile label (e.g. Personal, Work): ');
    if (!name) {
      print('❌ Profile label cannot be empty.', COLORS.red);
      return null;
    }
    const username = await ask('GitHub Username: ');
    if (!username) {
      print('❌ Username cannot be empty.', COLORS.red);
      return null;
    }
    const email = await ask('Git Email: ');
    if (!email) {
      print('❌ Email cannot be empty.', COLORS.red);
      return null;
    }
    const protocolChoice = await selectOption('Preferred git URL connection protocol:', [
      'HTTPS (Format: https://username@github.com/owner/repo.git)',
      'SSH (Format: git@github.com:owner/repo.git)'
    ]);
    const protocol = protocolChoice === 0 ? 'https' : 'ssh';

    const newProfile = { name, username, email, protocol };
    config.profiles.push(newProfile);
    
    try {
      fs.writeFileSync(profilesPath, JSON.stringify(config, null, 2), 'utf8');
      print(`✅ Profile "${name}" saved to ~/.git-profiles.json`, COLORS.green);
      return newProfile;
    } catch (err) {
      print(`❌ Failed to save profile to ~/.git-profiles.json: ${err.message}`, COLORS.red);
      return null;
    }
  };

  // If no profiles, force creation
  if (config.profiles.length === 0) {
    print('\nℹ️ No saved profiles found in your home directory.', COLORS.yellow);
    const profile = await createProfile();
    if (!profile) {
      print('❌ A profile is required to proceed.', COLORS.red);
      process.exit(1);
    }
  }

  // Select profile menu loop
  let selectedProfile = null;

  while (selectedProfile === null) {
    const profileOptions = config.profiles.map(p => 
      `${p.name} (Username: ${p.username}, Email: ${p.email}, Protocol: ${p.protocol.toUpperCase()})`
    );
    profileOptions.push('Add a new profile...');

    const profileChoice = await selectOption('Which GitHub profile would you like to push with?', profileOptions);
    if (profileChoice === profileOptions.length - 1) {
      await createProfile();
    } else {
      selectedProfile = config.profiles[profileChoice];
    }
  }

  print(`\n👤 Using profile: ${selectedProfile.name} (Username: ${selectedProfile.username})`, COLORS.bold + COLORS.cyan);

  // 6. Configure local git user credentials
  runGit(['config', 'user.name', `"${selectedProfile.username}"`]);
  runGit(['config', 'user.email', `"${selectedProfile.email}"`]);
  print(`✅ Git configured local credentials in repository:`, COLORS.green);
  print(`   user.name  -> ${selectedProfile.username}`);
  print(`   user.email -> ${selectedProfile.email}`);

  // 7. Manage remote origin
  let remoteUrl = '';
  const remoteRes = runGit(['remote', 'get-url', 'origin']);
  
  if (!remoteRes.success) {
    print('\nℹ️ No remote "origin" found in this repository.', COLORS.yellow);
    const configureRemote = await askYesNo('Would you like to set up a remote "origin"?', true);
    
    if (configureRemote) {
      const repoInput = await ask('Enter repository name or path (e.g. "owner/repo" or just "repo"): ');
      if (!repoInput) {
        print('❌ Repository name cannot be empty. Skipping remote setup.', COLORS.red);
      } else {
        const fullRepo = repoInput.includes('/') ? repoInput : `${selectedProfile.username}/${repoInput}`;
        if (selectedProfile.protocol === 'https') {
          remoteUrl = `https://${selectedProfile.username}@github.com/${fullRepo}.git`;
        } else {
          remoteUrl = `git@github.com:${fullRepo}.git`;
        }
        
        const remoteAddRes = runGit(['remote', 'add', 'origin', remoteUrl]);
        if (remoteAddRes.success) {
          print(`✅ Remote "origin" added with URL: ${remoteUrl}`, COLORS.green);
        } else {
          print(`❌ Failed to add remote: ${remoteAddRes.stderr || remoteAddRes.error}`, COLORS.red);
        }
      }
    }
  } else {
    const existingUrl = remoteRes.output;
    print(`\nℹ️ Found existing remote "origin": ${existingUrl}`, COLORS.cyan);
    
    const updateRemote = await askYesNo('Would you like to align the remote URL with the selected profile?', true);
    if (updateRemote) {
      const repoPath = parseRepoFromUrl(existingUrl);
      if (!repoPath) {
        print('❌ Could not parse repository path from existing URL. Please enter it manually.', COLORS.yellow);
        const repoInput = await ask('Enter repository path (e.g., "owner/repo"): ');
        if (repoInput) {
          if (selectedProfile.protocol === 'https') {
            remoteUrl = `https://${selectedProfile.username}@github.com/${repoInput}.git`;
          } else {
            remoteUrl = `git@github.com:${repoInput}.git`;
          }
        }
      } else {
        if (selectedProfile.protocol === 'https') {
          remoteUrl = `https://${selectedProfile.username}@github.com/${repoPath}.git`;
        } else {
          remoteUrl = `git@github.com:${repoPath}.git`;
        }
      }

      if (remoteUrl) {
        const remoteSetRes = runGit(['remote', 'set-url', 'origin', remoteUrl]);
        if (remoteSetRes.success) {
          print(`✅ Updated remote "origin" URL to: ${remoteUrl}`, COLORS.green);
        } else {
          print(`❌ Failed to update remote URL: ${remoteSetRes.stderr || remoteSetRes.error}`, COLORS.red);
        }
      }
    } else {
      remoteUrl = existingUrl;
    }
  }

  // Reload current remote in case setup failed or was skipped
  const finalRemoteRes = runGit(['remote', 'get-url', 'origin']);
  if (!finalRemoteRes.success) {
    print('❌ A remote "origin" must be configured to push the project.', COLORS.red);
    process.exit(1);
  }
  remoteUrl = finalRemoteRes.output;

  // 8. Confirm and run the push command
  print('\n🏁 Ready to push!', COLORS.bold + COLORS.green);
  print(`   Branch:  ${branch}`);
  print(`   Account: ${selectedProfile.name} (GitHub: ${selectedProfile.username})`);
  print(`   Remote:  origin (${remoteUrl})`);
  
  const proceed = await askYesNo('🚀 Proceed with pushing to GitHub?', true);
  if (!proceed) {
    print('Push cancelled by user.', COLORS.yellow);
    process.exit(0);
  }

  print(`\nRunning: git push -u origin ${branch}...`, COLORS.bold + COLORS.cyan);
  const pushSuccess = await spawnGit(['push', '-u', 'origin', branch]);
  
  if (pushSuccess) {
    print('\n🎉 Project successfully pushed to GitHub!', COLORS.bold + COLORS.green);
  } else {
    print('\n❌ Git push failed.', COLORS.bold + COLORS.red);
    print(`Tips:`, COLORS.yellow);
    print(`1. If this is a new repository, check if you created it first on GitHub: https://github.com/new`);
    print(`2. Make sure you have correct permissions for this repository.`);
    print(`3. If using HTTPS, ensure Git Credential Manager prompts and logins with user '${selectedProfile.username}'.`);
    print(`4. If using SSH, ensure you have added your SSH private key to your ssh-agent (ssh-add).`);
  }
}

main().catch((err) => {
  console.error('\n❌ An unexpected error occurred:', err);
}).finally(() => {
  rl.close();
});
