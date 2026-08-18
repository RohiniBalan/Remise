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

const { getRoleRedirectUrl } = loadModule('./authRedirect.ts');

test('getRoleRedirectUrl correctly maps roles to dashboards', () => {
  assert.equal(getRoleRedirectUrl('store_owner'), '/store/dashboard');
  assert.equal(getRoleRedirectUrl('wholesaler'), '/wholesaler/dashboard');
  assert.equal(getRoleRedirectUrl('whole_saler'), '/wholesaler/dashboard');
  assert.equal(getRoleRedirectUrl('home_business'), '/home-business/dashboard');
  assert.equal(getRoleRedirectUrl('admin'), '/admin/dashboard');
  assert.equal(getRoleRedirectUrl('customer'), '/');
  assert.equal(getRoleRedirectUrl('user'), '/');
  assert.equal(getRoleRedirectUrl(null), '/');
  assert.equal(getRoleRedirectUrl(undefined), '/');
});
