document.addEventListener('DOMContentLoaded', () => {
    const vinylCollection = document.querySelector('.vinyl-collection');

    const projectNames = [
        'About_me.html',
        'Project_Urban_Oasis.html',
        'Project_Migrant_Worker_RC.html',
        'Project_Medan_Resort.html',
        'Project_Garden_Pavilion.html',
        'Project_Voronoi_Tower.html',
        'Grasshopper_Rhino_Projects.html',
        'Case_Studies_Projects.html'
    ]; // Array of new project names
    
    // Create vinyl items
    for (let i = 0; i < 8; i++) { // Change the loop to create 8 vinyl items
        const vinylContainer = document.createElement('div');
        vinylContainer.classList.add('vinyl-container');

        const vinylCover = document.createElement('div');
        vinylCover.classList.add('vinyl-cover');

        const vinyl = document.createElement('div');
        vinyl.classList.add('vinyl');
        vinyl.dataset.projectId = i+1; // Assign a project ID
        vinyl.dataset.projectName = projectNames[i]; // Assign the project name

        console.log(`Vinyl ${i} assigned project name: ${projectNames[i]}`); // Debugging

        vinylContainer.appendChild(vinylCover);
        vinylContainer.appendChild(vinyl);
        vinylCollection.appendChild(vinylContainer);
    }

    // Scroll effect
    window.addEventListener('scroll', () => {
        const scrollX = window.scrollX;
        const maxScrollX = vinylCollection.scrollWidth - window.innerWidth;
        const centerOffset = (window.innerWidth - vinylCollection.firstElementChild.offsetWidth) / 2;
        const translateX = Math.min(scrollX * 0.5, maxScrollX - centerOffset);
        vinylCollection.style.transform = `translateX(${translateX}px)`; // Adjust for horizontal scrolling
    });

    // Mouse wheel scroll effect
    window.addEventListener('wheel', (event) => {
        event.preventDefault();
        const vinylWidth = document.querySelector('.vinyl-container').offsetWidth + 350; // Width of vinyl + gap
        window.scrollBy({
            left: event.deltaY < 0 ? -2 * vinylWidth : 2 * vinylWidth, // Scroll by the width of one vinyl
            behavior: 'smooth'
        });
    }, { passive: false }); // Gets rid of the '[Intervention] Unable to preventDefault inside passive event listener due to target being treated as passive.' error, which is caused by preventDefault(). // CHANGED THIS

    // Click functionality
    vinylCollection.addEventListener('click', (event) => {
        if (event.target.classList.contains('vinyl')) {
            const projectName = event.target.dataset.projectName; // Get the project name from the dataset
            if (projectName) {
                window.location.href = `projects/${projectName}`; // Navigate to project page
            }
        }
    });

    const vinylCovers = document.querySelectorAll('.vinyl-cover');
    const images = [
        'images/vinyl1_image.png',
        'path/to/your/image2.jpg',
        'path/to/your/image3.jpg',
        'path/to/your/image4.jpg',
        'path/to/your/image5.jpg',
        'path/to/your/image6.jpg',
        'path/to/your/image7.jpg'
    ];

    vinylCovers.forEach((cover, index) => {
        cover.style.backgroundImage = `url(${images[index]})`;
    });

    const vinylContainers = document.querySelectorAll('.vinyl-container');
    const vinyls = document.querySelectorAll('.vinyl');

    const aboutMeButton = document.getElementById('about-me-button');
    const portfolioButton = document.getElementById('portfolio-button');

    const headerIcon = document.getElementById('header-icon');
    const textBox = document.getElementById('text-box');
    const aboutMeText = document.getElementById('about-me-text');

    // Set the "SAM'S PORTFOLIO" button as initially active
    portfolioButton.classList.add('active');

    aboutMeButton.addEventListener('click', () => {
        // Highlight the "ABOUT ME" button
        aboutMeButton.classList.add('active');
        portfolioButton.classList.remove('active');

        // Animate the header icon
        headerIcon.classList.add('animate');

        // Change the body background color and show the text box
        document.body.classList.add('dark-grey-background');
        textBox.style.display = 'block';
        aboutMeText.style.display = 'block'; // Show the About Me text

        // Hide the vinyl elements
        vinylContainers.forEach(container => container.classList.add('hidden'));
        vinylCovers.forEach(cover => cover.classList.add('hidden'));
        vinyls.forEach(vinyl => vinyl.classList.add('hidden'));
    });

    portfolioButton.addEventListener('click', () => {
        // Highlight the "SAM'S PORTFOLIO" button
        portfolioButton.classList.add('active');
        aboutMeButton.classList.remove('active');

        // Reset the header icon size smoothly
        headerIcon.classList.remove('animate');

        // Revert the body background color to black and hide the text box
        document.body.classList.remove('dark-grey-background');
        textBox.style.display = 'none';
        aboutMeText.style.display = 'none'; // Hide the About Me text

        // Unhide the vinyl elements
        vinylContainers.forEach(container => container.classList.remove('hidden'));
        vinylCovers.forEach(cover => cover.classList.remove('hidden'));
        vinyls.forEach(vinyl => vinyl.classList.remove('hidden'));
    });
});
