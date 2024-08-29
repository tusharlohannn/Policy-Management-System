document.getElementById('loginSubmitButton').addEventListener('click', () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const role = document.getElementById('loginPerson').value;

  if (username === '' || password === '') {
      alert('Please fill out all fields.');
      return;
  }

  const loginData = {
      username: username,
      password: password,
      role: role
  };

  fetch('/login', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
  })
  .then(response => {
      if (!response.ok) {
          return response.json().then(data => {
              throw new Error(data.error);
          });
      }
      return response.json();
  })
  .then(data => {
      if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('username', username);
          const headers = new Headers();
          headers.append('Authorization', `Bearer ${data.token}`);
          if (data.role === 'admin') {
            window.location.href = '/private/admin.html';
        } else {
            window.location.href = '/private/user.html';
        }
      }
  })
  .catch(error => {
      alert(error.message);
  });
});

