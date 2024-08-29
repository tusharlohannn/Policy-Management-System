document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const tableBody = document.querySelector('#inventoryTable tbody');
  const requestPolicyForm = document.getElementById('requestPolicyForm');
  const mainContainer = document.getElementById('mainContainer');
  let policyIdToRequest = null;

  if (!token) {
    window.location.href = '/';
    return;
  }

  document.getElementById('welcomeMessage').textContent = `Welcome, ${username}`;

  fetchInventory();

  function fetchInventory() {
    fetch('/inventory', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          throw new Error(text);
        });
      }
      return response.json();
    })
    .then(policies => {
      tableBody.innerHTML = '';
      policies.forEach(policy => {
        const row = document.createElement('tr');
        row.dataset.id = policy.id;
        row.innerHTML = `
          <td>${policy.id}</td>
          <td>${policy.policy_number || 'N/A'}</td>
          <td>${policy.insured_party || 'N/A'}</td>
          <td>${policy.coverage_type || 'N/A'}</td>
          <td>${formatDateForTable(policy.start_date) || 'N/A'}</td>
          <td>${formatDateForTable(policy.end_date) || 'N/A'}</td>
          <td>${policy.premium_amount || 'N/A'}</td>
          <td>${policy.status || 'N/A'}</td>
          <td>
            <button class="requestButton" data-id="${policy.id}">Request</button>
          </td>
        `;
        tableBody.appendChild(row);
      });

      document.querySelectorAll('.requestButton').forEach(button => {
        button.addEventListener('click', (event) => {
          policyIdToRequest = event.target.dataset.id;
          requestPolicyForm.style.display = 'block';
          mainContainer.classList.add('blur');
        });
      });
    })
    .catch(err => {
      console.error('Error fetching inventory:', err);
      alert('Failed to fetch inventory. Check the console for details.');
    });
  }

  document.getElementById('requestSaveButton').addEventListener('click', () => {
    if (!policyIdToRequest) return;

    fetch(`/policyRequests/${policyIdToRequest}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (response.ok) {
        alert('Request sent to admin.');
        requestPolicyForm.style.display = 'none';
        mainContainer.classList.remove('blur');
      } else {
        return response.json().then(data => {
          throw new Error(data.message);
        });
      }
    })
    .catch(err => alert('Policy already Requested.'));
    requestPolicyForm.style.display = 'none';
    mainContainer.classList.remove('blur');
  });


  
  document.getElementById('requestCloseButton').addEventListener('click', () => {
    requestPolicyForm.style.display = 'none';
    mainContainer.classList.remove('blur');
  });

  document.getElementById('logoutButton').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '../index.html';
  });

  function formatDateForTable(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
  }
});
