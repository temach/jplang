// Function to generate a unique GUID of 6 characters from Base62 character set
function generateGUID() {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Find the <a> element by ID
const registerLink = document.getElementById("click_to_register");

// Add an event listener for "click" events
registerLink.addEventListener("click", function(event) {
  // Prevent the default action of following the link
  event.preventDefault();

  // Check if a moonspeak_username cookie is present
  const cookies = document.cookie.split(';');
  let guid = null;
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith('moonspeak_username=')) {
      guid = cookie.substring('moonspeak_username='.length, cookie.length);
      break;
    }
  }

  // Generate a new GUID if one was not found
  if (guid === null) {
    guid = generateGUID();
    const date = new Date();
    date.setTime(date.getTime() + (10 * 365 * 24 * 60 * 60 * 1000)); // 10 years from now
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `moonspeak_username=${guid}; ${expires}; path=/`;
  }

  // Redirect the user to a URL targeting this unique GUID
  window.location.href = `/router/route/u-${guid}-s-graph/`;
});
