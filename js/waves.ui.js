/******************************************************************************
 * Copyright © 2016 The Waves Developers.                                     *
 *                                                                            *
 * See the LICENSE files at                                                   *
 * the top-level directory of this distribution for the individual copyright  *
 * holder information and the developer policies on copyright and licensing.  *
 *                                                                            *
 * Unless otherwise agreed in a custom licensing agreement, no part of the    *
 * Waves software, including this file, may be copied, modified, propagated,  *
 * or distributed except according to the terms contained in the LICENSE      *
 * file.                                                                      *
 *                                                                            *
 * Removal or modification of this copyright notice is prohibited.            *
 *                                                                            *
 ******************************************************************************/
/**
 * @depends {3rdparty/jquery-2.1.0.js}
 * @depends {3rdparty/big.js}
 * @depends {3rdparty/jsbn.js}
 * @depends {3rdparty/jsbn2.js}
 * @depends {3rdparty/webdb.js}
 * @depends {3rdparty/jquery.growl.js}
 * @depends {3rdparty/clipboard.js}
 * @depends {crypto/curve25519.js}
 * @depends {crypto/curve25519_.js}
 * @depends {crypto/base58.js}
 * @depends {crypto/blake32.js}
 * @depends {crypto/keccak32.js}
 * @depends {crypto/passphrasegenerator.js}
 * @depends {crypto/sha256worker.js}
 * @depends {crypto/3rdparty/cryptojs/aes.js}
 * @depends {crypto/3rdparty/cryptojs/sha256.js}
 * @depends {crypto/3rdparty/jssha256.js}
 * @depends {crypto/3rdparty/seedrandom.js}
 * @depends {util/converters.js}
 * @depends {util/extensions.js}
 * @depends {waves.js}
 */
var Waves = (function(Waves, $, undefined) {
	"use strict";

    Waves.balance  = 0;
    Waves.hasLocalStorage = false;
    Waves.update;
    Waves.blockUpdate;
    Waves.blockHeight;

    //These are the functions running every Waves.stateIntervalSeconds for each page.
    Waves.pages = {
        'mBB-wallet': function updateWallet () {

            Waves.loadAddressBalance(Waves.address, function (balance) {

                var formatBalance = Waves.formatAmount(balance);

                $("#wavesCurrentBalance").val(formatBalance);
                $("#wavesbalance").html(formatBalance.split(".")[0]);
                $("#wavesbalancedec").html('.'+formatBalance.split(".")[1]);
                $("#balancespan").html(formatBalance +' WAVE');
                $('.balancewaves').html(formatBalance + ' WAVE');
                $(".wB-add").html(Waves.address);

            });

            Waves.getAddressHistory(Waves.address, function(history) {

                var transactionHistory = history[0];
                var appContainer;

                transactionHistory.sort(function(x, y){
                    return y.timestamp - x.timestamp;
                })

                var max = 10;

                $.each(transactionHistory, function(historyKey, historyValue) {
                    
                    if(max > 0) {
                        appContainer += '<tr>';
                        appContainer += '<td>'+Waves.formatTimestamp(historyValue.timestamp)+'</td>';
                        appContainer += '<td>'+historyValue.type+'</td>';
                        appContainer += '<td>'+historyValue.sender+'</td>';
                        appContainer += '<td>'+historyValue.recipient+'</td>';
                        appContainer += '<td>'+historyValue.fee+' WVL</td>';
                        appContainer += '<td>'+Waves.formatAmount(historyValue.amount)+' WAVE</td>';
                        appContainer += '</tr>';
                    }
                    max--;
                });

                $("#walletTransactionhistory").html(appContainer);

            
            });


        },
        'mBB-portfolio': function updatePortfolio () {
            //Auto Updating Portfolio Page Items
        },
        'mBB-exchange': function updateExchange() {
            //Auto Updating Exchange Page Items
        },
        'mBB-voting' : function updateVoting() {
            //Auto Updating Voting Page Items
        },
        'mBB-history': function updateHistory() {
            
            Waves.getAddressHistory(Waves.address, function(history) {

                var transactionHistory = history[0];
                var appContainer;

                transactionHistory.sort(function(x, y){
                    return y.timestamp - x.timestamp;
                })

                $.each(transactionHistory, function(historyKey, historyValue) {

                        appContainer += '<tr>';
                        appContainer += '<td>'+Waves.formatTimestamp(historyValue.timestamp)+'</td>';
                        appContainer += '<td>'+historyValue.type+'</td>';
                        appContainer += '<td>'+historyValue.sender+'</td>';
                        appContainer += '<td>'+historyValue.recipient+'</td>';
                        appContainer += '<td>'+historyValue.fee+' WVL</td>';
                        appContainer += '<td>'+Waves.formatAmount(historyValue.amount)+' WAVE</td>';
                        appContainer += '</tr>';

                });

                $("#transactionhistory").html(appContainer);

            
            });

        },
        'mBB-messages': function updateMessages () {
            //Auto Updating Messages Page Items
        },
        'mBB-community': function updateCommunity () {

            var amountOfBlocks = 100;
            var row = '';
            var endBlock = Waves.blockHeight;
            var startBlock = endBlock - amountOfBlocks;
            Waves.apiRequest(Waves.api.blocks.lastBlocks(startBlock, endBlock), function(response) {

                response.sort(function(x, y){
                    return y.timestamp - x.timestamp;
                })

                $.each(response, function(blockKey, blockData) {

                    var block = Waves.blockHeight - blockKey;
                    row += '<tr class="fade">'+
                        '<td>'+block+'</td>'+
                        '<td>'+Waves.formatTimestamp(blockData.timestamp)+'</td>'+
                        '<td>'+blockData.transactions.length+'</td>'+
                        '<td>'+blockData.generator+'</td>'+
                    '</tr>';

                });

                $("#latestBlocksTable").html(row);

            });

        }
    };

    Waves.updateDOM = function (page) {

        var interval = Waves.stateIntervalSeconds * 1000;
        if (Waves.pages[page]) {
            Waves.pages[page]();
            Waves.update = setInterval(function() {

            //Updating page functions
             Waves.pages[page]();

             //Load Blocks regularly
             Waves.apiRequest(Waves.api.blocks.height, function(result) {
            
                Waves.blockHeight = result.height;
                $("#blockheight").html(result.height);

            }); 

         }, interval);
        }
    }

    // Show/hide different sections on tab activation
    // The ROUTING
    $('input[type=radio]').click(function(){

        $('.mBB-content, .LBmBB-content').fadeOut(200).delay(400);
        $('#' + $(this).val()).fadeIn(800);
        $('#LB' + $(this).val()).fadeIn(800);

        var linkType = $(this).val();

        clearInterval(Waves.update);
        Waves.updateDOM($(this).val());

        switch(linkType) {
            case 'mBB-portfolio':
                Waves.loadPayment();
            break;
        }
    });

   
    $("#wavessend").on("click", function(e) {
        e.preventDefault();

        $("#errorpayment").html('');
        var currentBalance = $("#wavesCurrentBalance").val();
        var maxSend = (currentBalance * Math.pow(10,8) ) - 1;
        maxSend = maxSend / Math.pow(10,8);
        var sendAmount = $("#wavessendamount").val().replace(/\s+/g, '');

        if(sendAmount > maxSend) {

            $.growl.error({ message: 'Error: Not enough funds' });
            return;

        }

        var amount = Math.round(Number(sendAmount * 100000000));
        var unmodifiedAmount = Number(sendAmount);

        var senderPassphrase = converters.stringToByteArray(Waves.passphrase);
        var senderPublic = Base58.decode(Waves.publicKey);
        var senderPrivate = Base58.decode(Waves.privateKey);
        var recipient = $("#wavesrecipient").val().replace(/\s+/g, '');

        var wavesTime = Number(Waves.getTime());

        var signature;
        var fee = Number(1);

        var signatureData = Waves.signatureData(Waves.publicKey, recipient, amount, fee, wavesTime);
        var signature = Array.from(Waves.curve25519.sign(senderPrivate, signatureData));
        signature = Base58.encode(signature);

        //var verify = Waves.curve25519.verify(senderPublic, signatureData, Base58.decode(signature));

        var data = {
          "recipient": recipient,
          "timestamp": wavesTime,
          "signature": signature,
          "amount": amount,
          "senderPublicKey": Waves.publicKey,
          "fee": fee
        }

        Waves.apiRequest(Waves.api.waves.broadcastTransaction, JSON.stringify(data), function(response) {

            var fixFee = fee / 100000000;
            if(response.error !== undefined) {
                $.growl.error({ message: 'Error:'+response.error +' - '+response.message });
            } else {

                var successMessage = 'Sent '+Waves.formatAmount(amount)+' Wave to '+recipient.substr(0,10)+'...';
                $.growl({ title: 'Payment sent!', message: successMessage });
                $("#wavesrecipient").val('');
                $("#wavessendamount").val('');

                $.modal.close();
            }

        });

    });

    $("#addContact").on("click", function(e) {
        e.preventDefault();

        $("#contactForm").toggle();
    });

    $("#addContactSubmit").on("click", function(e) {
        e.preventDefault();

        var name = $("#contactname").val();
        var address = $("#contactaddress").val();
        var email = $("#contactemail").val();

        var accountData = {
            name: name,
            address: address,
            email: email
        };

        if(Waves.hasLocalStorage) {

            var currentAccounts = localStorage.getItem('WavesContacts');
                currentAccounts = JSON.parse(currentAccounts);

            if(currentAccounts !== undefined && currentAccounts !== null) {

                currentAccounts.contacts.push(accountData);
                localStorage.setItem('WavesContacts', JSON.stringify(currentAccounts));
                var row = Waves.contactRow(accountData);
                $("#contactTable").append(row);

            } else {

                var accountArray = { contacts: [accountData] };
                localStorage.setItem('WavesContacts', JSON.stringify(accountArray));
                var row = Waves.contactRow(accountData);
                $("#contactTable").append(row);
            }

        }

    });


    $("#tabs-Icons-community").on("click", function(e) {

        var currentAccounts = localStorage.getItem('WavesContacts');
            currentAccounts = JSON.parse(currentAccounts);

        var row;
        $.each(currentAccounts.contacts, function(contactKey, contactData) {
            
            row += Waves.contactRow(contactData);
    
        });

        $("#contactTable").html(row);

    });    

    $('#uiTB-iconset-logout').click(function() {
        Waves.logout();  
    });


    //Add Copy-to-Clipboard to class clipSpan
    var clipboard = new Clipboard('.clipSpan');

    clipboard.on('success', function(e) {
      
         $.growl.notice({ message: "Address successfully copied to clipboard." });

        e.clearSelection();
    });

    clipboard.on('error', function(e) {
         $.growl.warning({ message: "Could not copy address to clipboard." });
    });

    //How to growl:
    /*
      $.growl({ title: "Growl", message: "The kitten is awake!", url: "/kittens" });
      $.growl.error({ message: "The kitten is attacking!" });
      $.growl.notice({ message: "The kitten is cute!" });
      $.growl.warning({ message: "The kitten is ugly!" });
  */

	return Waves;
}(Waves || {}, jQuery));


$(document).ready(function(){

    Waves.initApp();
    $('.tooltip').tooltipster();
    
    $('#tooltipTest').tooltipster({
        content: $('<span><img src="my-image.png" /> <strong>This text is in bold case !</strong></span>')
    });
    
    $('.tooltip-1').tooltipster({
        theme: 'tooltipster-theme1',
        delay: 1000,
        contentAsHTML: true
    });
    
    $('.tooltip-2').tooltipster({
        theme: 'tooltipster-theme2',
        delay: 1000
    });
    
    $('.tooltip-3').tooltipster({
        theme: 'tooltipster-theme3',
        delay: 1000,
        contentAsHTML: true
    });

});







