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
        validator : undefined,
        getForm : function() {
            return $('#' + Waves.UI.sendWavesForm.id);
        },
        setupValidation : function() {
            $('#' + this.containerId).on($.modal.BEFORE_OPEN, function(event, modal) {
                Waves.UI.sendWavesForm.validator = Waves.UI.sendWavesForm.getForm().validate({
                    errorClass : 'wInput-error',
                    rules : {
                        wavesrecipient : {
                            required : true,
                            address : true
                        },
                        wavessendamount : {
                            required : true,
                            decimal : true,
                            min : Waves.UI.constants.MINIMUM_PAYMENT_AMOUNT
                        }
                    },
                    messages : {
                        wavesrecipient : {
                            required : 'Recipient account number is required'
                        },
                        wavessendamount : {
                            required : 'Amount to send is required',
                            decimal : 'Amount to send must be a decimal number with dot (.) as a decimal separator',
                            min : 'Payment amount is too small. It should be greater or equal to ' +
                                Waves.UI.constants.MINIMUM_PAYMENT_AMOUNT.toFixed(Waves.UI.constants.AMOUNT_DECIMAL_PLACES)
                        }
                    }
                });
            });

            $('#' + this.containerId).on($.modal.BEFORE_CLOSE, function(event, modal) {
                if (Waves.UI.sendWavesForm.validator !== undefined)
                    Waves.UI.sendWavesForm.validator.resetForm();
            });
        },

        isValid : function() {
            return this.getForm().valid();
        }
    };

	$("#wavessend").on("click", function(e) {
        e.preventDefault();

        $("#errorpayment").html('');

        if (!Waves.UI.sendWavesForm.isValid())
            return;

        var currentBalance = $("#wavesCurrentBalance").val();
        var maxSend = (currentBalance * Math.pow(10,8) ) - 1;
        maxSend = maxSend / Math.pow(10,8);
        var sendAmount = Number($("#wavessendamount").val().replace(/\s+/g, ''));

        if(sendAmount > maxSend) {
            $.growl.error({ message: 'Error: Not enough funds' });
            return;
        }

        var amount = Math.round(sendAmount * 100000000);
        var unmodifiedAmount = sendAmount;

        var senderPassphrase = converters.stringToByteArray(Waves.passphrase);
        var senderPublic = Base58.decode(Waves.publicKey);
        var senderPrivate = Base58.decode(Waves.privateKey);
        var recipient = Waves.Addressing.fromDisplayAddress($("#wavesrecipient").val().replace(/\s+/g, ''));

        var wavesTime = Number(Waves.getTime());

        var fee = Number(1);

        var signatureData = Waves.signatureData(Waves.publicKey, recipient.getRawAddress(), amount, fee, wavesTime);
        var signature = Waves.sign(senderPrivate, signatureData);

        //var verify = Waves.curve25519.verify(senderPublic, signatureData, Base58.decode(signature));

        if(sendAmount > maxSend) {
            $.growl.error({ message: 'Error: Not enough funds' });
            return;
        }

        var data = {
          "recipient": recipient.getRawAddress(),
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

                var successMessage = 'Sent '+Waves.formatAmount(amount)+' Wave to '+recipient.getDisplayAddress().substr(0,10)+'...';
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