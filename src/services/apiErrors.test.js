import { readApiResponse, userError } from './apiErrors';
test('explains duplicate registration without exposing JSON', async () => {
  const response = { ok: false, status: 409, json: async () => ({status:'error', message:'Student already exists'}) };
  try { await readApiResponse(response); throw new Error('expected failure'); } catch(error) {
    expect(userError(error)).toContain('رقم القيد موجود');
    expect(userError(error)).not.toContain('{');
  }
});
test('hides server output and explains malformed responses', async () => {
  await expect(readApiResponse({status:500, json:async()=>{throw new SyntaxError('<html>SQL password secret');}})).rejects.toMatchObject({userMessage:expect.stringContaining('خلل في الخادم')});
});
test('explains network failures and hides unknown technical errors', () => {
  expect(userError(new TypeError('Failed to fetch'))).toContain('تعذر الاتصال');
  expect(userError(new Error('{"secret":"sql"}'))).not.toContain('secret');
});
