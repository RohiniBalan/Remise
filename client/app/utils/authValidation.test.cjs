const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');

function loadModule(relativePath) {
  const absolutePath = path.resolve(__dirname, relativePath);
  const source = fs.readFileSync(absolutePath, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: absolutePath,
  });

  const module = { exports: {} };
  const context = vm.createContext({ module, exports: module.exports, require, __dirname, __filename: absolutePath, process, console });
  vm.runInContext(outputText, context, { filename: absolutePath });
  return module.exports;
}

const { validateSignupForm } = loadModule('./authValidation.ts');

test('signup validation does not require a confirm password field', () => {
  const errors = validateSignupForm({
    fullname: 'Jane Doe',
    email: 'jane@example.com',
    mobilenumber: '9876543210',
    password: 'Abcdef1!',
    confirmPassword: '',
  });

  assert.equal(errors.confirmPassword, undefined);
  assert.equal(Object.keys(errors).length, 0);
});
