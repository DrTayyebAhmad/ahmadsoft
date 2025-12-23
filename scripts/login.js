// Admin password configuration
// Change this password to secure your admin access
const ADMIN_PASSWORD = 'khizar2661';

document.getElementById('admin-login-form').addEventListener('submit', function(e) {
	e.preventDefault();
	
	const password = document.getElementById('password').value;
	
	if (password === ADMIN_PASSWORD) {
		localStorage.setItem('isAuthenticated', 'true');
		window.location.href = 'manage-apps.html';
	} else {
		alert('Incorrect password. Please try again.');
		document.getElementById('password').value = '';
	}
});