// Find the <a> element by ID
const registerLink = document.getElementById("click_to_register");

// Add an event listener for "click" events
registerLink.addEventListener("click", function(event) {
  // Prevent the default action of following the link
  event.preventDefault();

  // Redirect the user to a URL for creating
  window.location.href = `/router/route/manager/new/`;
});
