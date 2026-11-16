$( document ).ready(function() {
    
//Show credits
$( document ).on( "click", "#credits-link", function(event) {
	event.preventDefault();
	$("#credits").addClass("visible");
});

//Hide credits
$( document ).on( "click", ".credits-close", function(event) {
	event.preventDefault();
	$("#credits").removeClass("visible");
});

$( document ).on( "mouseover", ".next", function(event) {
	event.preventDefault();
	$(this).addClass("visible");
});

$( document ).on( "mouseout", ".next", function(event) {
	event.preventDefault();
	$(this).removeClass("visible");
});

var isIndexLoaded = false;

//Show index
$( document ).on( "click", ".menuToggle", function(event) {
	event.preventDefault();
	
	//hide content
	$("#page").fadeOut(300, 
		function(){
			//check if index has already been loaded this view
			if(isIndexLoaded == true) {
				$('body').addClass('index-visible');

				setTimeout(
			  	function() 
			  		{
						$("#page--index").fadeIn(300);
			  		}, 300
			  	);
			}

			else {

				//create placeholder for index
				$('body #page').after('<div id="page--index"></div>');

				//display and load index content
				$("#page--index").load(""+ contentsUrl +" #page");
				$('body').addClass('index-visible');

				$( document ).ajaxComplete(function() {
		  			$("#page--index").fadeIn(300);
		  			isIndexLoaded = true;
				}); 
			}
		});
});

//Hide index
$( document ).on( "click", ".index-close", function(event) {
	event.preventDefault();
	$('body').removeClass('index-visible');
	$("#page--index").fadeOut(300, 
		function(){
			$("#credits").removeClass("visible");
			$("#page").fadeIn(300);
		});
});

//Image width checker

$( ".content-area .wp-block-image.is-resized img" ).each(function( index ) {
  let width = $(this).attr('width');
  $(this).css("width", width);
});

});