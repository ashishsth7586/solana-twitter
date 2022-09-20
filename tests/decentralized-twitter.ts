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
    console.log(tweetAccount)

    // ensure it has the right data
    assert.equal(tweetAccount.author.toBase58(), program.provider.wallet.publicKey.toBase58())
    assert.equal(tweetAccount.topic, "ashish")
    assert.equal(tweetAccount.content, "hummus, am I right?")
    assert.ok(tweetAccount.timestamp)
  })

});
