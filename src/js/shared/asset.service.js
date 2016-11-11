(function () {
    'use strict';

    function WavesAssetService(constants, utilityService, cryptoService) {
        function validateSender(sender) {
            if (angular.isUndefined(sender.publicKey))
                throw new Error('Sender account public key hasn\'t been set');

            if (angular.isUndefined(sender.privateKey))
                throw new Error('Sender account private key hasn\'t been set');
        }

        function validateAsset(asset) {
            if (angular.isUndefined(asset.name))
                throw new Error('Asset name hasn\'t been set');

            if (angular.isUndefined(asset.totalTokens))
                throw new Error('Total tokens amount hasn\'t been set');

            if (angular.isUndefined(asset.decimalPlaces))
                throw new Error('Token decimal places amount hasn\'t been set');
        }

        function validateTransfer(transfer) {
            if (angular.isUndefined(transfer.recipient))
                throw new Error('Recipient account hasn\'t been set');

            if (angular.isUndefined(transfer.fee))
                throw new Error('Transaction fee hasn\'t been set');

            if (transfer.fee.currency !== Currency.WAV)
                throw new Error('Transaction fee must be nominated in Waves');

            if (angular.isUndefined(transfer.amount))
                throw new Error('Transaction amount hasn\'t been set');
        }

        function validateReissue(reissue) {
            if (angular.isUndefined(reissue.totalTokens))
                throw new Error('Total tokens amount hasn\'t been set');

            if (angular.isUndefined(reissue.fee))
                throw new Error('Transaction fee hasn\'t been set');

            if (reissue.fee.currency !== Currency.WAV)
                throw new Error('Transaction fee must be nominated in Waves');
        }

        function buildCreateAssetSignatureData (asset, tokensQuantity, senderPublicKey) {
            var typeByte = [constants.ASSET_ISSUE_TRANSACTION_TYPE];
            var publicKeyBytes = utilityService.base58StringToByteArray(senderPublicKey);
            var assetNameBytes = stringToByteArrayWithSize(asset.name);
            var assetDescriptionBytes = stringToByteArrayWithSize(asset.description);
            var quantityBytes = utilityService.longToByteArray(tokensQuantity);
            var decimalPlacesBytes = [asset.decimalPlaces];
            var reissuableBytes = booleanToBytes(asset.reissuable);
            var feeBytes = utilityService.longToByteArray(asset.fee.toCoins());
            var timestampBytes = utilityService.longToByteArray(asset.time);

            return [].concat(typeByte, publicKeyBytes, assetNameBytes, assetDescriptionBytes,
                quantityBytes, decimalPlacesBytes, reissuableBytes, feeBytes, timestampBytes);
        }

        function stringToByteArrayWithSize (string) {
            var bytes = converters.stringToByteArray(string);

            return byteArrayWithSize(bytes);
        }

        function byteArrayWithSize (byteArray) {
            var result = utilityService.shortToByteArray(byteArray.length);

            return result.concat(byteArray);
        }

        function currencyToBytes (currencyId, mandatory) {
            if (mandatory) {
                if (angular.isUndefined(currencyId))
                    throw new Error('CurrencyId is mandatory');

                return utilityService.base58StringToByteArray(currencyId);
            }
            return angular.isDefined(currencyId) ?
                [1].concat(utilityService.base58StringToByteArray(currencyId)) : [0];
        }

        function booleanToBytes (flag) {
            return flag ? [1] : [0];
        }

        this.createAssetIssueTransaction = function (asset, sender) {
            validateAsset(asset);
            validateSender(sender);

            asset.time = asset.time || utilityService.getTime();
            asset.description = asset.description || '';
            var assetCurrency = new Currency({
                displayName: asset.name,
                symbol: '',
                precision: asset.decimalPlaces
            });

            var tokens = new Money(asset.totalTokens, assetCurrency);
            var signatureData = buildCreateAssetSignatureData(asset, tokens.toCoins(), sender.publicKey);
            var signature = buildSignature(signatureData, sender);

            return {
                name: asset.name,
                description: asset.description,
                quantity: tokens.toCoins(),
                decimals: asset.decimalPlaces,
                reissuable: asset.reissuable,
                timestamp: asset.time,
                fee: asset.fee.toCoins(),
                senderPublicKey: sender.publicKey,
                signature: signature
            };
        };

        function buildCreateAssetTransferSignatureData(transfer, senderPublicKey) {
            var typeByte = [constants.ASSET_TRANSFER_TRANSACTION_TYPE];
            var publicKeyBytes = utilityService.base58StringToByteArray(senderPublicKey);
            var assetIdBytes = currencyToBytes(transfer.amount.currency.id);
            var recipientBytes = utilityService.base58StringToByteArray(transfer.recipient);
            var amountBytes = utilityService.longToByteArray(transfer.amount.toCoins());
            var feeBytes = utilityService.longToByteArray(transfer.fee.toCoins());
            var feeAssetBytes = currencyToBytes(transfer.fee.currency.id);
            var timestampBytes = utilityService.longToByteArray(transfer.time);
            var attachmentBytes = byteArrayWithSize(transfer.attachment);

            return [].concat(typeByte, publicKeyBytes, assetIdBytes, feeAssetBytes, timestampBytes,
                amountBytes, feeBytes, recipientBytes, attachmentBytes);
        }

        this.createAssetTransferTransaction = function (transfer, sender) {
            validateTransfer(transfer);
            validateSender(sender);

            transfer.time = transfer.time || utilityService.getTime();
            transfer.attachment = transfer.attachment || [];

            var signatureData = buildCreateAssetTransferSignatureData(transfer, sender.publicKey);
            var signature = buildSignature(signatureData, sender);

            return {
                recipient: transfer.recipient,
                timestamp: transfer.time,
                assetId: transfer.amount.currency.id,
                amount: transfer.amount.toCoins(),
                fee: transfer.fee.toCoins(),
                senderPublicKey: sender.publicKey,
                signature: signature,
                attachment: cryptoService.base58.encode(transfer.attachment)
            };
        };

        function buildSignature(bytes, sender) {
            var privateKeyBytes = cryptoService.base58.decode(sender.privateKey);

            return cryptoService.nonDeterministicSign(privateKeyBytes, bytes);
        }

        function buildCreateAssetReissueSignatureData(reissue, senderPublicKey) {
            var typeByte = [constants.ASSET_REISSUE_TRANSACTION_TYPE];
            var publicKeyBytes = utilityService.base58StringToByteArray(senderPublicKey);
            var assetIdBytes = currencyToBytes(reissue.totalTokens.currency.id, true);
            var quantityBytes = utilityService.longToByteArray(reissue.totalTokens.toCoins());
            var reissuableBytes = booleanToBytes(reissue.reissuable);
            var feeBytes = utilityService.longToByteArray(reissue.fee.toCoins());
            var timestampBytes = utilityService.longToByteArray(reissue.time);

            return [].concat(typeByte, publicKeyBytes, assetIdBytes, quantityBytes, reissuableBytes,
                feeBytes, timestampBytes);
        }

        this.createAssetReissueTransaction = function (reissue, sender) {
            validateReissue(reissue);
            validateSender(sender);

            reissue.time = reissue.time || utilityService.getTime();

            var signatureData = buildCreateAssetReissueSignatureData(reissue, sender.publicKey);
            console.log(cryptoService.base58.encode(signatureData));
            var signature = buildSignature(signatureData, sender);

            return {
                assetId: reissue.totalTokens.currency.id,
                quantity: reissue.totalTokens.toCoins(),
                reissuable: reissue.reissuable,
                timestamp: reissue.time,
                fee: reissue.fee.toCoins(),
                senderPublicKey: sender.publicKey,
                signature: signature
            };
        };
    }

    WavesAssetService.$inject = ['constants.transactions', 'utilityService', 'cryptoService'];

    angular
        .module('app.shared')
        .service('assetService', WavesAssetService);
})();
