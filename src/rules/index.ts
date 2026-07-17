import { syncEnvRule } from './sync-env.js';
import { missingEnvInCodeRule } from './missing-env-in-code.js';
import { unusedEnvRule } from './unused-env.js';
import { secretLeakRule } from './secret-leak.js';
import type { Rule } from '../types.js';

export const rules: Rule[] = [syncEnvRule, missingEnvInCodeRule, unusedEnvRule, secretLeakRule];

export { syncEnvRule, missingEnvInCodeRule, unusedEnvRule, secretLeakRule };
