async function test() {
  const getCsrf = await fetch('http://localhost:3000/api/auth/csrf');
  const { csrfToken } = await getCsrf.json();
  const cookies = getCsrf.headers.get('set-cookie');
  console.log('CSRF Token:', csrfToken);
  console.log('Cookies:', cookies);

  const res = await fetch('http://localhost:3000/api/auth/callback/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookies
    },
    body: new URLSearchParams({
      csrfToken,
      email: 'staff.kediri@example.com',
      password: 'password123',
      json: 'true'
    })
  });

  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text);
}

test().catch(console.error);
