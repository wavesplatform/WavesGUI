"use strict";

var server = Waves.server;

var balance = 0;








function loadWallet() {

	var appContainer;

	$.getJSON(server+'/addresses/', function(response) {

		appContainer += '<h2>YOUR WALLETS</h2><div class="wavesTable">';

		appContainer += '<table>';
		appContainer += '<thead><tr><th>Key</th><th>Value</th></tr></thead>';
		appContainer += '<tbody>';

		$.each(response, function(key, value) {

			$.each(value, function(innerkey, innervalue) {

				appContainer += '<tr><td>';
				appContainer += innerkey;
				appContainer += '</td><td>';
				appContainer += innervalue;
				appContainer += '</td></tr>';

			});

			

		});

		appContainer += '<tbody>';

		appContainer += '</div>';

		appContainer += '<button class="btn btn-primary" id="newAddress">New Address</button>';

		
		$("#walletContainer").html(appContainer);

		$("#newAddress").on("click", function() {

			$.post(server+'/addresses/', function(createAddress) {

				loadWallet();

			});

		});


	});

}

/*
function loadPeers() {

	var appContainer;
	var welcomeJumbo = '<div class="jumbotron"><h2>All Waves Peers</h2></div>';

	appContainer = welcomeJumbo;

	$.getJSON(server+'/peers/all', function(response) {

		appContainer += '<div class="container"><h2>Your peers</h2><button class="btn btn-primary" id="updatePeers">Update</button>';

		appContainer += '<table class="table table-striped">';
		appContainer += '<thead><tr><th>Key</th><th>Value</th></tr></thead>';
		appContainer += '<tbody>';

		$.each(response, function(key, value) {

			$.each(value, function(innerkey, innervalue) {

				appContainer += '<tr><td>';
				appContainer += innerkey;
				appContainer += '</td><td>';
				appContainer += innervalue.address;
				appContainer += '</td></tr>';

			});

			

		});

		appContainer += '<tbody>';

		appContainer += '</div>';
		
		$("#app").html(appContainer);

		$("#updatePeers").on("click", function() {
			loadPeers();
		});


	});


}

function createTransactionTable (valueValue) {

	var appContainer;

	$.each(valueValue, function(transactionKey, transactionValue) {


		appContainer += '<table class="table"></table>';

		appContainer += '<thead><tr><th>Type</th><th>Fee</th><th>Timestamp</th><th>Amount</th><th>Sender</th><th>Recipient</th></tr></thead>';

		appContainer += '<tbody><tr><td>'+transactionValue.type+'</td><td>'+transactionValue.fee+'</td><td>'+transactionValue.timestamp+'</td><td>'+transactionValue.amount+'</td><td>'+transactionValue.sender+'</td><td>'+transactionValue.recipient+'</td></tr></tbody>';

		appContainer += '</table>';

		return appContainer;



	});

}

function loadBlock() {


	var appContainer;
	var welcomeJumbo = '<div class="jumbotron"><h2>Welcome to Waves Demo Platform</h2></div>';

	appContainer = welcomeJumbo;

	$.getJSON(server+'/blocks/last', function(response) {

		appContainer += '<div class="container"><h2>Latest Block</h2><button class="btn btn-primary" id="updateBlock">Update</button>';

		appContainer += '<table class="table table-striped">';
		appContainer += '<thead><tr><th>Key</th><th>Value</th></tr></thead>';
		appContainer += '<tbody>';

		$.each(response, function(key, value) {

		
				appContainer += '<tr><td>';
				appContainer += key;
				appContainer += '</td><td>';
				appContainer += value;
				appContainer += '</td></tr>';


		});

		appContainer += '</tbody>';

		appContainer += '</div>';
		
		$("#app").html(appContainer);
		
		$("#updateBlock").on("click", function() {
			loadBlock();
		});


	});


}


function loadConsensus() {


	var appContainer;
	var welcomeJumbo = '<div class="jumbotron"><h2>Waves Consensus</h2></div>';

	appContainer = welcomeJumbo;

	$.getJSON(server+'/consensus/algo', function(response) {

		appContainer += '<div class="container"><h2>Consensus Type</h2>';

		appContainer += '<table class="table table-striped">';
		appContainer += '<thead><tr><th>Key</th><th>Value</th></tr></thead>';
		appContainer += '<tbody>';

		$.each(response, function(key, value) {

			appContainer += '<tr><td>';
			appContainer += key;
			appContainer += '</td><td>';
			appContainer += value;
			appContainer += '</td></tr>';

		});

		appContainer += '</tbody>';
		appContainer += '</table>';

		
		appContainer += '<h2>Current Target</h2><button class="btn btn-primary" id="updateTarget">Update</button>';


		appContainer += '<table class="table table-striped">';
		appContainer += '<thead><tr><th>Key</th><th>Value</th></tr></thead>';
		appContainer += '<tbody>';

		$.getJSON(server+'/consensus/basetarget', function (response_target) {


			$.each(response_target, function(key, value) {

				appContainer += '<tr><td>';
				appContainer += key;
				appContainer += '</td><td>';
				appContainer += value;
				appContainer += '</td></tr>';

			});

			appContainer += '</tbody>';
			appContainer += '</table>';

			appContainer += '</div>';

			$("#app").html(appContainer);

			$("#updateTarget").on("click", function() {
				loadConsensus();
			});



		});
		


	});

}

*/

function loadPayment () {

	var	paymentForm = '<div id="wallet_accounts"><h2>YOUR WALLETS</h2> <button class="btn btn-primary" id="newAddress">New Address</button></div>';
		paymentForm += '<div id="accounts_sender" class="wavesTable"><table><thead><tr><th>ADDRESS</th><th>BALANCE</th></thead><tbody id="accounts_table"></tbody></table></div><hr/>';
		paymentForm += '</div><div id="payment_response"></div>';

		paymentForm += '<h2 style="margin-top: .5rem;">SEND PAYMENT</h2>'+
						'<form id="paymentForm">'+
							'<div class="paymentForm">'+
							  '  <table>'+
							  '  	<thead>'+
							  '			<tr>'+
							  '				<th>DESCRIPTION</th>'+
							  '				<th>INPUT</th>'+
							  '			</tr>'+
							  '  	</thead>'+
							  '		<tbody>'+
							  '			<tr>'+
							  '				<td>Sender (choose one account with balance from above)</td>'+
							  '				<td><input type="text" class="form-control" id="sender" placeholder="Sender"></td>'+
							  '			</tr>'+
							  '			<tr>'+
							  '				<td>Recipient</td>'+
							  '				<td><input type="text" class="form-control" id="recipient" placeholder="Recipient"></td>'+
							  '			</tr>'+
							  '			<tr>'+
							  '				<td>Amount</td>'+
							  '				<td><input type="number" class="form-control" id="sendamount" placeholder="Amount" min="0"></td>'+
							  '			</tr>'+
							  '			<tr>'+
							  '				<td>Fee</td>'+
							  '				<td><p>Fee 1 Waves</p></td>'+
							  '			</tr>'+
							  '			<tr>'+
							  '				<td>Send</td>'+
							  '				<td><button id="sendpayment" class="paymentForm-but fade" value="send">SUBMIT</button></td>'+
							  '			</tr>'+

							  '		</tbody>'+
							  '	  </table>'+
							  '</div>'+
						'</form>';


		paymentForm += '</div>';


	$("#portfolio").html(paymentForm);


	$.getJSON(server+'/addresses/', function(response) {

		balance = 0;

		$.each(response, function(key, value) {

			$.each(value, function(innerkey, innervalue) {

				$.getJSON(server+'/addresses/balance/'+innervalue, function(balanceResult) {


					$("#accounts_table").append('<tr><td>'+innervalue +'</td><td>'+balanceResult.balance+' Waves</td></tr>');

				});

			});
		});
	});


	$("#sendpayment").on("click", function(e) {

		e.preventDefault();

		var amount = $("#sendamount").val();
		var recipient = $("#recipient").val();
		var sender = $("#sender").val();

		$("#sendpayment").on("click", function() {


			if(amount > 0) {

				if(recipient > '') {

					var number = Number(amount);

					$.ajax({
						url: server+'/payment',
					    data: JSON.stringify({
							"amount": number,
							"fee": 1,
							"sender": sender,
							"recipient": recipient
						}),
					    type: "POST",
					    success: function(successrequest){
				

					        $("#sendamount").val('');
					        $("#recipient").val('');
					        $("#sender").val('');

					        var messageTable = '<div class="wavesTable">'+
					        						'<table>'+
					        						'	<thead>'+
					        						'		<tr>'+
						        					'			<th>Key</th>'+
						        					'			<th>Value</th>'+
					        						'		</tr>'+
				        							'	</thead>'+
			        								'	<tbody>'+
			        								'		<tr>'+
						        					'			<th>Timestamp</th>'+
						        					'			<td>'+successrequest.timestamp+'</td>'+
					        						'		</tr>'+
					        						'		<tr>'+
						        					'			<th>Sender</th>'+
						        					'			<td>'+successrequest.sender+'</td>'+
					        						'		</tr>'+
					        						'		<tr>'+
						        					'			<th>Recipient</th>'+
						        					'			<td>'+successrequest.recipient+'</td>'+
					        						'		</tr>'+
					        						'		<tr>'+
						        					'			<th>Amount</th>'+
						        					'			<td>'+successrequest.amount+' Waves</td>'+
						        					'		</tr>'+
						        					'		<tr>'+
						        					'			<th>Fee</th>'+
						        					'			<td>'+successrequest.fee+' Waves</td>'+
						        					'		</tr>'+
						        					'		<tr>'+
						        					'			<th>Signature</th>'+
						        					'			<td>'+successrequest.signature+'</td>'+
						        					'		</tr>'+
			        								'	</tbody>'+
		        									'</table>'+
	        									'</div>';

					        $("#payment_response").html('<h3>Sending successfull</h3>'+messageTable);

					    },
					    error: function(response){
					        $("#payment_response").html(response.message);
					        console.log(response);
					    }
					});

					

				} else {
					alert ('Please insert a recipient');
				}

			} else {
				alert ('Please insert an amount higher than 0');
			}

		});


	});


	$("#newAddress").on("click", function() {

		$.post(server+'/addresses/', function(createAddress) {

			console.log(createAddress);

			$("#accounts_table").append('<tr><td>'+createAddress.address +'</td><td>0 Waves</td></tr>');


		});

	});


}

/*

function loadDebug () {

	var debugPage = '<div class="container">'+
	'<div class="row"><h2>Settings File</h2>';

	debugPage += '<table class="table table-striped">';
	debugPage += '<thead><tr><th>Key</th><th>Value</th></tr></thead>';
	debugPage += '<tbody>';

	$.getJSON(server+'/debug/settings', function (response) {

		$.each(response, function(key, value) {

			debugPage += '<tr><td>';
			debugPage += key;
			debugPage += '</td><td>';
			debugPage += value;
			debugPage += '</td></tr>';

		});

		debugPage += '</tbody>';
		debugPage += '</table>';

		debugPage += '<h2>Info</h2>';

		debugPage += '<table class="table table-striped">';
		debugPage += '<thead><tr><th>Key</th><th>Value</th></tr></thead>';
		debugPage += '<tbody>';

		$.getJSON(server+'/debug/info', function (response_info) {

			$.each(response_info, function(key, value) {

				debugPage += '<tr><td>';
				debugPage += key;
				debugPage += '</td><td>';
				debugPage += value;
				debugPage += '</td></tr>';

			});


			debugPage += '</tbody>';
			debugPage += '</table>';


			$("#app").html(debugPage);

		});

	});


}

*/