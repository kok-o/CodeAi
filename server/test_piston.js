const code = `def reverse_string(s):
    return s[::-1]

import sys, json, inspect
def _codeai_run():
    input_str = sys.stdin.read().strip()
    if not input_str: 
        print('NO INPUT')
        return
    try:
        args = json.loads(input_str)
    except Exception as e:
        print('JSON ERROR', e)
        return
    funcs = [f for f in globals().values() if inspect.isfunction(f) and f.__module__ == '__main__' and f.__name__ != '_codeai_run']
    if not funcs: 
        print('NO FUNCS', globals().keys())
        return
    func = funcs[-1]
    res = func(*args) if isinstance(args, list) else func(args)
    print(json.dumps(res).replace(' ', ''))
if __name__ == '__main__':
    _codeai_run()
`;

fetch('https://emkc.org/api/v2/piston/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    language: 'python',
    version: '3.10.0',
    files: [{ name: 'main.py', content: code }],
    stdin: '["hello"]'
  })
}).then(res => res.json()).then(data => console.log(data)).catch(console.error);
