describe("waves.util", function() {

	function keyGenerationTestCase(encodedSeed, encodedExpectedPrivateKey, encodedExpectedPublicKey) {
		var seedBytes = Base58.decode(encodedSeed);
		var privateKey = Waves.buildPrivateKey(seedBytes);
		var publicKey = Waves.buildPublicKey(seedBytes);

		expect(privateKey).toEqual(encodedExpectedPrivateKey);
		expect(publicKey).toEqual(encodedExpectedPublicKey);
	}

	function hashingTestCase(encodedNoncedSeed, encodedExpectedHash) {
		var seedBytes = Base58.decode(encodedNoncedSeed);
		var hashBytes = Waves.hashChain(seedBytes);

		expect(Base58.encode(hashBytes)).toEqual(encodedExpectedHash);
	}

	it("should correctly convert long to byte array", function() {
		expect(Waves.longToByteArray(1)).toEqual([0,0,0,0,0,0,0,1]);
		expect(Waves.longToByteArray(12312)).toEqual([0, 0, 0, 0, 0, 0, 48, 24]);
	});
  
  it("generates correct private and public keys", function(){
	  keyGenerationTestCase("sfRTzgCRLuWEbYBtnmnt7DecxvKazTMEScJpnFWaacCFWy36E83iGR8F6bKrQtwc2yuKmKo1vQBV8cFca4K8eoy",
	  	"YoLY4iripseWvtMt29sc89oJnjxzodDgQ9REmEPFHkK",
	  	"3qTkgmBYFjdSEtib9C4b3yHiEexyJ59A5ZVjSvXsg569");
	  keyGenerationTestCase("QJLRHJVdAAxSucSzaBtDBhGDNiehe61vpFdHongK88jBa6ckZz5a57Hbb8PKtBL26dgAkJpsrX7Z9LT6egX2XAz",
		  "EVLXAcnJgnV1KUJasidEY4myaKwvh2d3p8CPc6srC32A",
		  "7CPECZ633JRSM39HrB8axeJMZWixBeo2p9bWfwwVAhYj");
	  keyGenerationTestCase("3bMpEZd31VLXnrFsPsqSANWzkHvkzwZ6GzGvMHZri7zUGkZuQbe9MQF86K1pkB36oy9LMQNfoXNsQhHzv1VMj7TF",
		  "98JtkrkqGqunaJqtN7J2kvJeUnvrTkpobDVArGXTVFa1",
		  "FKKmKKWsVBPFWufcTTJjoQZDjMG9jmgzAbFPjQm9DVj8");
  });
	
	it("generates expected hash for a predefined seed", function () {
		hashingTestCase("aVYPRLnqyyV367BssHsKUnkRgXXQYJcxSMgCuzZBBSD7ELnCzvMNmNKcjySu8fjYcERZCzvjqir5n2eCavh9oy4q4ro8B",
			"Cyw5mgkYiAsCKvKZveGvAD9bjNconFUduJDBLvTGAFXS");
		hashingTestCase("aVYPRLKUtvmfPK19KWBPjtXqmrbt9u2kmUKqagvpVuEeQ5KjXrQWM2fUmqFbJ2E5fhtqbQzPcZq4otaKWzht1T9TGkfVC",
			"Be8depGda1e9d5BVYJ55YXZmvRZTezaBTHHyJpmpqPgy");
		hashingTestCase("aVYPRNWYNk3yvhLJtr83AHqVKonhtRwxsmdJf36qnxiRaUKbGfRWTeJg3jGLLhFQGXaGhHiggxhKXrwU5ZQZVTkomhtaC",
			"5Afu7yvvwckWDabWG3LHFqLMBHy8uoyxiVahdNo39rp9");
	});

	it("deterministic transaction signature is the same as computed by backend", function () {
		var messageBytes = Base58.decode("Psm3kB61bTJnbBZo3eE6fBGg8vAEAG");
		var publicKey = Base58.decode('biVxMhzqLPDVS8hs9w5TtjXxtmNqeoHX21kHRDmszzV');
		var privateKey = Base58.decode('4nAEobwe4jB5Cz2FXDzGDEPge89YaWm9HhKwsFyeHwoc');

		var signature = Waves.deterministicSign(privateKey, messageBytes);
		expect(Waves.verify(publicKey, messageBytes, Base58.decode(signature))).toBe(true);
		expect(signature).toEqual('2HhyaYcKJVEPVgoPkjN3ZCVYKaobwxavLFnn75if6D95Nrc2jHAwX72inxsZpv9KVpMASqQfDB5KRqfkJutz5iav');

		signature = Waves.nonDeterministicSign(privateKey, messageBytes);
		expect(Waves.verify(publicKey, messageBytes, Base58.decode(signature))).toBe(true);
	});

	it("should generate network addresses locally", function() {
		// testing testnet address generation
		Waves.constants.NETWORK_CODE = 'T';
		expect(Waves.buildRawAddress("5ug8nQ1ubfjAZVJFed4mcXVVEBz53DfV8nBQWuKbt2AJ"))
			.toEqual("3Mtkz8KeXUZmTbNH1MFcrMGv4t1av5tmaFL");
		expect(Waves.buildRawAddress("9iDrC31brcunVTRCq69iUngg1S5Ai1rd6iX7vTwAGTvn"))
			.toEqual("3N33kaYS3C9pvVsVjLKLApmRQHfzm3UY36N");
		expect(Waves.buildRawAddress("Dq5f76Ro3qQCPWSDrCNrVDCiKwNFKCP2UmnVZzPxVf8"))
			.toEqual("3NBmgsTgGv8nfmYzbCiKvTuBJtDpVyyxqKr");
		expect(Waves.buildRawAddress("6tk94Rwij3FXwfaJLWu9PhQAHDY2MUjPLYkHQ28HaRk3"))
			.toEqual("3MstHyC4tKtBhzbWdhrJ3jkxPD1hYSJCi77");
		expect(Waves.buildRawAddress("2oGDrLRdBsU9Nb32jgPMh3TrQXm9QifUBLnLijfWqY5e"))
			.toEqual("3MzUpwpiNTr32YWoYVmRFyzJQgdDbti3shP");
		expect(Waves.buildRawAddress("71m88eJxbfJnNPW87r4Qtrp9Q2qa1wsLYmrxXRAzLPF6"))
			.toEqual("3MwJXUURjZY2BmbMDRMwgGnJ19RZC9Hdg3V");
		expect(Waves.buildRawAddress("7Ftuept6hfNEhSeVA439asPWZQVuteqWQUEPz6RGHsAo"))
			.toEqual("3MpETHR7opAMN6dWqJejq1X37YCkq6Nu5hK");
		expect(Waves.buildRawAddress("AEYsMR1171SmhV77rDtBTyfjmFubzirpHqFH4hV1aDt9"))
			.toEqual("3MyciTA8STrTWjZ46KdoZ1ASf5GuY7sD8be");

		// testing mainnet address generation
		Waves.constants.NETWORK_CODE = 'W';
		expect(Waves.buildRawAddress("D1vnz91YRXyDM72R6ZsPZfj1woMzL5nZtFrfeGQYjMs6"))
			.toEqual("3PKGL4nMz3sMESQXPzmX5GKbiQtCi2Tu9Z5");
		expect(Waves.buildRawAddress("9Emin4uvu2cew67hkpkX2ZKV6NJEjyP7Uvzbf8ARMCc6"))
			.toEqual("3P9oRcFxwjW58bqu1oXyk1JrRTy8ADSKvdN");
	});
});
