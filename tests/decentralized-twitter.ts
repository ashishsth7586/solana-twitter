import * as anchor from "@project-serum/anchor";
import * as assert from "assert";

describe("decentralized-twitter", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.DecentralizedTwitter // as Program<DecentralizedTwitter>;

  it('can send a new tweet', async () => {
    const tweet = anchor.web3.Keypair.generate()
    
    await program.methods.sendTweet("ashish", "hummus, am I right?").accounts({
      tweet: tweet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
      author: program.provider.wallet.publicKey

    }).signers([tweet]).rpc()
    // Fetch the account details of the created tweet.
    const tweetAccount = await program.account.tweet.fetch(tweet.publicKey)

    // ensure it has the right data
    assert.equal(tweetAccount.author.toBase58(), program.provider.wallet.publicKey.toBase58())
    assert.equal(tweetAccount.topic, "ashish")
    assert.equal(tweetAccount.content, "hummus, am I right?")
    assert.ok(tweetAccount.timestamp) // aserts timestamp is non-empty
  })

  it('can send a new tweet without a topic', async() => {
    const tweet = anchor.web3.Keypair.generate()
    await program.methods.sendTweet('', 'hello world').accounts({
      tweet: tweet.publicKey,
      author: program.provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId
    }).signers([tweet]).rpc()

    const tweetAccount = await program.account.tweet.fetch(tweet.publicKey)
    
    // Ensure iit has the right data
    assert.equal(tweetAccount.author.toBase58(), program.provider.wallet.publicKey.toBase58())
    assert.equal(tweetAccount.topic, "")
    assert.equal(tweetAccount.content, "hello world")
    assert.ok(tweetAccount.timestamp)
  })

  it('can send a new tweet from a different author', async () => {
    const tweet = anchor.web3.Keypair.generate()
    const otherUser = anchor.web3.Keypair.generate()

    const signature = await program.provider.connection.requestAirdrop(otherUser.publicKey, 1000000000);
    await program.provider.connection.confirmTransaction(signature);


    await program.methods.sendTweet('hello', 'hello worldw').accounts({
      tweet: tweet.publicKey,
      author: otherUser.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId
    }).signers([otherUser, tweet]).rpc()

    const tweetAccount = await program.account.tweet.fetch(tweet.publicKey)

    assert.equal(tweetAccount.author.toBase58(), otherUser.publicKey.toBase58())
  })

  it('cannot provide a topic with more than 50 characters', async () => {
    try {
      const tweet = anchor.web3.Keypair.generate()
      await program.methods.sendTweet('this is more than 50 characters sentence. Is it? you need to find one', 'no content').accounts({
        tweet: tweet.publicKey,
        author: program.provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId
      }).signers([tweet]).rpc()
    } catch (error) {
      assert.equal(error.error.errorMessage, "The provided topic should be 50 characters long maximum.")
      return
    }

    assert.fail("The instruction should have failed with a more than 50-characters topic.")
  })

  it("can fetch all tweets", async() => {
    const tweetAccounts = await program.account.tweet.all()
    assert.equal(tweetAccounts.length, 3)
  })

  it('can filter tweets by author', async () => {
    const authorPublicKey = program.provider.wallet.publicKey
    const tweetAccounts = await program.account.tweet.all([
        {
            memcmp: {
                offset: 8, // Discriminator.
                bytes: authorPublicKey.toBase58(),
            }
        }
    ]);

    assert.equal(tweetAccounts.length, 2);
    assert.ok(tweetAccounts.every((tweetAccount: any) => {
      console.log(tweetAccount)
      return tweetAccount.account.author.toBase58() === authorPublicKey.toBase58()
  }))
});
});
