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
 * @depends {3rdparty/jquery-validate.js}
 * @depends {3rdparty/additional-methods.js}
 * @depends {3rdparty/bootstrap.js}
 * @depends {3rdparty/big.js}
 * @depends {3rdparty/jsbn.js}
 * @depends {3rdparty/jsbn2.js}
 * @depends {3rdparty/webdb.js}
 * @depends {3rdparty/growl.js}
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
 */
var Waves = (function(Waves, $, undefined) {
	"use strict";

    if (Waves.UI === undefined)
        Waves.UI = {};

    Waves.UI.sendWavesForm = {
        id : 'send-waves-form',
        containerId : 'wB-butSend-WAV',
        setupValidation : function() {
            $('#' + this.containerId).on($.modal.BEFORE_OPEN, function(event, modal) {
                $('#' + Waves.UI.sendWavesForm.id).validate({
                    errorClass : 'wInput-error',
                    rules : {
                        wavesrecipient : {
                            required : true,
                            minlength : 30
                        },
                        wavessendamount : {
                            required : true,
                            number : true,
                            min : Waves.UI.constants.MINIMUM_PAYMENT_AMOUNT
                        }
                    },
                    messages : {
                        wavesrecipient : {
                            required : 'Recipient account number is required',
                            minlength : 'Recipient account number is too short'
                        },
                        wavessendamount : {
                            required : 'Amount to send is required',
                            number : 'Amount to send must be a decimal number with decimal separator as a dot',
                            min : 'Payment amount is too small. It should be greater or equal to ' +
                                Waves.UI.constants.MINIMUM_PAYMENT_AMOUNT.toFixed(Waves.UI.constants.AMOUNT_DECIMAL_PLACES)
                        }
                    }
                });
            });
        },

        isValid : function() {
            return $('#' + Waves.UI.sendWavesForm.id).valid();
        }
    };

    $("#wavessendamount").keydown(function(e) {
        return;
        
        var charCode = !e.charCode ? e.which : e.charCode;

        if (Waves.isControlKey(charCode) || e.ctrlKey || e.metaKey) {
            return;
        }

        var maxFractionLength = 8;

        //allow 1 single period character
        if (charCode == 110 || charCode == 190) {
            if ($(this).val().indexOf(".") != -1) {
                e.preventDefault();
                return false;
            } else {
                return;
            }
        }

        var input = $(this).val() + String.fromCharCode(charCode);
        var afterComma = input.match(/\.(\d*)$/);

        //only allow as many as there are decimals allowed.. 
        if (afterComma && afterComma[1].length > maxFractionLength) {
            e.preventDefault();
            $.growl.notice({ message: "Only 8 decimals allowed!" });
            return false;
        }

        //numeric characters, left/right key, backspace, delete, home, end
        if (charCode == 8 || charCode == 37 || charCode == 39 || charCode == 46 || charCode == 36 || charCode == 35 || (charCode >= 48 && charCode <= 57 && !isNaN(String.fromCharCode(charCode))) || (charCode >= 96 && charCode <= 105)) {
        } else {
            //comma
            if (charCode == 188) {
                $.growl.notice({ message: "Comma as decimal seperator is not allowed, use a dot instead!" });
            }
            e.preventDefault();
            return false;
        }


    });

	$("#wavessend").on("click", function(e) {
        e.preventDefault();

        $("#errorpayment").html('');

        if (!Waves.UI.sendWavesForm.isValid())
            return;

        var currentBalance = $("#wavesCurrentBalance").val();
        var maxSend = (currentBalance * Math.pow(10,8) ) - 1;
        maxSend = maxSend / Math.pow(10,8);
        var sendAmount = $("#wavessendamount").val().replace(/\s+/g, '');

        if(sendAmount > maxSend) {
            $.growl.error({ message: 'Error: Not enough funds' });
            return;
        }

        if (sendAmount < Waves.UI.constants.MINIMUM_PAYMENT_AMOUNT) {
            $.growl.error({message : 'Payment amount is too small.\nThe minimum amount you can send is ' +
                Waves.UI.constants.MINIMUM_PAYMENT_AMOUNT.toFixed(Waves.UI.constants.AMOUNT_DECIMAL_PLACES) });
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

        if(recipient.length < 10) {
            $.growl.error({ message: 'Malformated recipient' });
            return;
        }
        if(sendAmount > maxSend) {
            $.growl.error({ message: 'Error: Not enough funds' });
            return;
        }
        if(amount < 1) {
            $.growl.error({ message: 'Minimum Amount to send is 0.00000001 Wave' });
            return;
        }

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

    Waves.UI.sendWavesForm.setupValidation();
	
	return Waves;
}(Waves || {}, jQuery));