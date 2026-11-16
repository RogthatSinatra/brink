//if the radios are multiple
const completingElements = document.querySelectorAll('.completing');

// Iterate over each 'completing' element
completingElements.forEach(function (completing) {
    // Get the closest form element using the 'closest' method
    const completeForm = completing.closest('form');

    // Add an event listener for the 'change' event on each 'completing' element
    completing.addEventListener('change', function () {
        // Submit the closest form
        completeForm.submit();
    });
});
