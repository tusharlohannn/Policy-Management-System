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
  fetchTotalPolicies();
  fetchPendingRequestsCount();
  fetchPendingRequests();

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


  function fetchTotalPolicies() {
    fetch('/inventory/count', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      let total = document.createElement('h2');
      total.textContent = `Total Policies: ${data.count}`;
      document.getElementById('tableBody').appendChild(total);
    })
    .catch(err => {
      console.error('Error fetching total number of policies:', err);
      alert('Failed to fetch total number of policies. Check the console for details.');
    });
  }

  function fetchPendingRequestsCount() {
    fetch('/policyRequests/count', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      let totalPending = document.createElement('h2');
      totalPending.textContent = `Total Pending Requests: ${data.count}`;
      document.getElementById('tableBody').appendChild(totalPending);
    })
    .catch(err => {
      console.error('Error fetching total number of pending requests:', err);
      alert('Failed to fetch total number of pending requests. Check the console for details.');
    });
  }

  async function fetchPendingRequests() {
    try {
      const response = await fetch('/policyRequests', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const requests = await response.json();
      displayPendingRequests(requests);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  }
  

  function displayPendingRequests(requests) {
    const requestsContainer = document.getElementById('pendingRequestsContainerBody');
    requestsContainer.innerHTML = '';
  
    requests.forEach(request => {
      console.log('the request is: ', request);
      const row = document.createElement('tr');
      
      const idCell = document.createElement('td');
      idCell.textContent = request.id;
      
      const policyNumberCell = document.createElement('td');
      policyNumberCell.textContent = request.policy_number;
      
      const requestedByCell = document.createElement('td');
      requestedByCell.textContent = request.requested_by;
      
      const actionCell = document.createElement('td');
      
      const acceptButton = document.createElement('button');
      acceptButton.textContent = 'Accept';
      acceptButton.addEventListener('click', () => handleAccept(request.id));
      
      const rejectButton = document.createElement('button');
      rejectButton.textContent = 'Reject';
      rejectButton.addEventListener('click', () => handleReject(request.id));
      
      acceptButton.classList.add('acceptButton');
      rejectButton.classList.add('rejectButton');
      actionCell.appendChild(acceptButton);
      actionCell.appendChild(rejectButton);
      actionCell.classList.add('buttonsFlex');
      
      row.appendChild(idCell);
      row.appendChild(policyNumberCell);
      row.appendChild(requestedByCell);
      row.appendChild(actionCell);
  
      requestsContainer.appendChild(row);
    });
  }
  
  async function handleAccept(requestId) {
    try {
      const response = await fetch(`/policyRequests/${requestId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const result = await response.json();
      alert(result.message);
      fetchPendingRequests();
      fetchPendingRequestsCount();
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  }

  async function handleReject(requestId) {
    try {
      const response = await fetch(`/policyRequests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const result = await response.json();
      alert(result.message);
      fetchPendingRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  }

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
