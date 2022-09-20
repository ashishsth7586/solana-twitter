import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { DecentralizedTwitter } from "../target/types/decentralized_twitter";

describe("decentralized-twitter", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.DecentralizedTwitter as Program<DecentralizedTwitter>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
