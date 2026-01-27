// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT LOGIN COMMAND
// Authentication with ScopeAgent cloud
// ═══════════════════════════════════════════════════════════════

import inquirer from 'inquirer';
import ui from '../utils/ui';
import auth from '../utils/auth';
import api from '../utils/api';

// ───────────────────────────────────────────────────────────────
// LOGIN COMMAND
// ───────────────────────────────────────────────────────────────

export interface LoginOptions {
  apiKey?: string;
  email?: string;
}

export async function loginCommand(options: LoginOptions): Promise<void> {
  ui.printBanner();

  // Check if already authenticated
  if (auth.isAuthenticated()) {
    const user = auth.getUser();
    if (user) {
      ui.printInfo(`Already logged in as ${ui.colors.amber(user.email)}`);
      ui.newLine();

      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: 'Continue with current account', value: 'continue' },
            { name: 'Switch to a different account', value: 'switch' },
            { name: 'Log out', value: 'logout' },
          ],
        },
      ]);

      if (action === 'continue') {
        return;
      } else if (action === 'logout') {
        auth.logout();
        ui.printSuccess('Logged out successfully');
        return;
      }
      // If 'switch', continue with login flow
    }
  }

  // API key authentication
  if (options.apiKey) {
    const spinner = ui.spinner('Validating API key...');
    spinner.start();

    auth.saveApiKey(options.apiKey);

    // Verify the API key works
    const result = await api.getMe();

    if (result.success && result.data) {
      auth.saveUser(result.data);
      spinner.succeed(ui.colors.mint('API key validated'));
      ui.newLine();
      ui.printSuccess(`Authenticated as ${ui.colors.amber(result.data.email)}`);
      showAccountInfo(result.data);
    } else {
      auth.clearApiKey();
      spinner.fail(ui.colors.coral('Invalid API key'));
      ui.printError(result.error || 'Failed to validate API key');
      process.exit(1);
    }

    return;
  }

  // Interactive login
  ui.printInfo('Log in to ScopeAgent');
  ui.newLine();

  const { method } = await inquirer.prompt([
    {
      type: 'list',
      name: 'method',
      message: 'How would you like to authenticate?',
      choices: [
        { name: 'Email & Password', value: 'email' },
        { name: 'API Key', value: 'apikey' },
        { name: 'Create new account', value: 'register' },
      ],
    },
  ]);

  if (method === 'apikey') {
    const { apiKey } = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: 'Enter your API key:',
        mask: '*',
      },
    ]);

    await loginCommand({ apiKey });
    return;
  }

  // Email authentication
  const credentials = await inquirer.prompt([
    {
      type: 'input',
      name: 'email',
      message: 'Email:',
      default: options.email,
      validate: (input) => {
        if (!input.includes('@')) return 'Please enter a valid email';
        return true;
      },
    },
    {
      type: 'password',
      name: 'password',
      message: 'Password:',
      mask: '*',
      validate: (input) => {
        if (input.length < 8) return 'Password must be at least 8 characters';
        return true;
      },
    },
  ]);

  const spinner = ui.spinner(method === 'register' ? 'Creating account...' : 'Logging in...');
  spinner.start();

  let result;
  if (method === 'register') {
    result = await api.register(credentials.email, credentials.password);
  } else {
    result = await api.login(credentials.email, credentials.password);
  }

  if (result.success && result.data) {
    spinner.succeed(ui.colors.mint(method === 'register' ? 'Account created' : 'Logged in'));
    ui.newLine();
    ui.printSuccess(`Welcome, ${ui.colors.amber(result.data.user.email)}!`);
    showAccountInfo(result.data.user);
  } else {
    spinner.fail(ui.colors.coral(method === 'register' ? 'Registration failed' : 'Login failed'));
    ui.printError(result.error || 'Authentication failed');
    process.exit(1);
  }
}

// ───────────────────────────────────────────────────────────────
// LOGOUT COMMAND
// ───────────────────────────────────────────────────────────────

export interface LogoutOptions {
  all?: boolean;
}

export async function logoutCommand(options: LogoutOptions): Promise<void> {
  ui.printBanner();

  if (!auth.isAuthenticated()) {
    ui.printInfo('Not currently logged in');
    return;
  }

  const user = auth.getUser();

  if (options.all) {
    auth.logoutFull();
    ui.printSuccess('Logged out and cleared all credentials');
  } else {
    auth.logout();
    ui.printSuccess(`Logged out${user ? ` from ${ui.colors.amber(user.email)}` : ''}`);
  }

  if (!options.all && auth.getApiKey()) {
    ui.printInfo('API key is still stored. Use --all to clear it.');
  }
}

// ───────────────────────────────────────────────────────────────
// WHOAMI COMMAND
// ───────────────────────────────────────────────────────────────

export async function whoamiCommand(): Promise<void> {
  ui.printBanner();

  if (!auth.isAuthenticated()) {
    ui.printInfo('Not logged in');
    ui.newLine();
    console.log(`Run ${ui.colors.cyan('scopeagent login')} to authenticate`);
    return;
  }

  const spinner = ui.spinner('Fetching account info...');
  spinner.start();

  const result = await api.getMe();

  if (result.success && result.data) {
    spinner.succeed(ui.colors.mint('Account info retrieved'));
    ui.newLine();
    showAccountInfo(result.data);
  } else {
    spinner.fail(ui.colors.coral('Failed to fetch account info'));
    ui.printError(result.error || 'Could not retrieve account information');

    // Show cached info if available
    const cachedUser = auth.getUser();
    if (cachedUser) {
      ui.newLine();
      ui.printInfo('Cached account info:');
      showAccountInfo(cachedUser);
    }
  }
}

// ───────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────

function showAccountInfo(user: { id: string; email: string; plan: string }): void {
  const planColors: Record<string, (text: string) => string> = {
    free: ui.colors.muted,
    pro: ui.colors.lavender,
    team: ui.colors.cyan,
    enterprise: ui.colors.amber,
  };

  const planColor = planColors[user.plan] || ui.colors.text;

  ui.newLine();
  console.log(ui.box(
    `${ui.icons.info} ${ui.colors.text('Email:')} ${ui.colors.amber(user.email)}\n` +
    `${ui.icons.config} ${ui.colors.text('Plan:')}  ${planColor(user.plan.toUpperCase())}\n` +
    `${ui.icons.action} ${ui.colors.text('ID:')}    ${ui.colors.muted(user.id)}`,
    'Account'
  ));

  if (user.plan === 'free') {
    ui.newLine();
    ui.printInfo(`Upgrade to Pro for more features: ${ui.colors.cyan('https://scopeagent.io/pricing')}`);
  }
}

// ───────────────────────────────────────────────────────────────
// API KEY MANAGEMENT
// ───────────────────────────────────────────────────────────────

export interface ApiKeyOptions {
  name?: string;
}

export async function createApiKeyCommand(options: ApiKeyOptions): Promise<void> {
  ui.printBanner();

  if (!auth.isAuthenticated()) {
    ui.printError('You must be logged in to create an API key');
    ui.newLine();
    console.log(`Run ${ui.colors.cyan('scopeagent login')} first`);
    process.exit(1);
  }

  const { name } = options.name
    ? options
    : await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'API key name:',
          default: `CLI-${new Date().toISOString().slice(0, 10)}`,
        },
      ]);

  const spinner = ui.spinner('Creating API key...');
  spinner.start();

  const result = await api.createApiKey(name!);

  if (result.success && result.data) {
    spinner.succeed(ui.colors.mint('API key created'));
    ui.newLine();

    console.log(ui.box(
      `${ui.icons.warning} ${ui.colors.cream('Copy this key now - it won\'t be shown again!')}\n\n` +
      `${ui.colors.amber(result.data.key)}`,
      'New API Key'
    ));

    ui.newLine();
    ui.printInfo('Use this key with:');
    console.log(`  ${ui.colors.cyan(`scopeagent login --api-key ${result.data.key}`)}`);
    console.log(`  ${ui.colors.muted('or set')} ${ui.colors.cyan('SCOPEAGENT_API_KEY')} ${ui.colors.muted('environment variable')}`);
  } else {
    spinner.fail(ui.colors.coral('Failed to create API key'));
    ui.printError(result.error || 'Could not create API key');
    process.exit(1);
  }
}

// ───────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────

export default {
  login: loginCommand,
  logout: logoutCommand,
  whoami: whoamiCommand,
  createApiKey: createApiKeyCommand,
};
