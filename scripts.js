$(document).ready(function(){

	var Game = $("#game").life().data('aviemet-life');
	window['Game'] = Game;

	$('#speed').html(Game.get('speed'));

	$('#seed').val(Game.get('seed'));

	$('#step').on('click', function(){
		Game.stepGeneration();
		Game.pause();
	});
	
	$('#start').on('click', function(){
		Game.play();
	});
	
	$('#stop').on('click', function(){
		Game.pause();
	});
	
	$('#random').on('click', function(){
		Game.randomSeed($('#seed').val());
	});
	
	$('#clear').click(function(){
		Game.clear();
	});
	
	$('#slower').on('click', function(){
		$("#speed").html(Game.slowDown());
	});
	
	$('#faster').on('click', function(){
		$("#speed").html(Game.speedUp());
	});

	$('#forms').change(function(){
		Game.drawForm(forms[$(this).val()]);
		$(this).val("default");
	});

});