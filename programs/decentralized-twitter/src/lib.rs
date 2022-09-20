use anchor_lang::prelude::*;

declare_id!("2JKko8GioaMmBEbe9P8fFDZ5XBBpWZ2kxRhrNZ7TQFcx");

// #[program]
// pub mod decentralized_twitter {
//     use super::*;

//     pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
//         Ok(())
//     }
// }

// #[derive(Accounts)]
// pub struct Initialize {}


#[account]
pub struct Tweet {
    pub author: Pubkey,
    pub timestamp: i64,
    pub topic: String,
    pub content: String
}

// 2. Add some useful constants for sizing properties.
const DISCRIMINATOR_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH: usize = 32;
const TIMESTAMP_LENGTH: usize = 8;
const STRING_LENGTH_PREFIX: usize = 4; // stores the size of the string.
const MAX_TOPIC_LENGTH: usize = 50 * 4; // 50 chars max, each UTF-8 holds 1-4 bytes
const MAX_CONTENT_LENGTH: usize = 280 * 4; // 280 chars max

// 3. Add a constant on the Tweet account that provides its total size.
impl Tweet {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH // Author
        + TIMESTAMP_LENGTH  // Timestamp
        + STRING_LENGTH_PREFIX + MAX_TOPIC_LENGTH // Topic
        + STRING_LENGTH_PREFIX + MAX_CONTENT_LENGTH; // Content
}

#[derive(Accounts)]
pub struct SendTweet<'info> {
    #[account(init, payer = author, space = Tweet::LEN)]
    pub tweet: Account<'info, Tweet>, // this is an account type provided by anchor.
    // it wraps the `AccountInfo` in another struct that parses the data accoriding to 
    // an account struct provided as a generic type. In this example above, Account<'info, Tweet>
    // means this is an account of type Tweett and the data should be parsed accoridingly.
    #[account(mut)]
    pub author: Signer<'info>, // `info is Rust lifetime, it is defnied as a generic type but
    // it is not a type. Its purpose is to tell the Rust compiler how long a variable will stay
    // alive for.
    // This is the same as the AccountInfo type execpt we're also saaying this account
    // should sign the instruction
    // #[account(address = system_program::ID)]
    // in newer version we dont need to provide attribute as above
    pub system_program: Program<'info, System>, // low-level solana structure that can
    // represent any account - when using AccountInfo type, the account's data will be an
    // unparsed array of bytes.
}


#[program]
pub mod decentralized_twitter {
    use super::*;
    // any argument whis is not an account can be provided this way, after the context
    // account will be in Context, here: SendTweet
    pub fn send_tweet(ctx: Context<SendTweet>, topic: String, content: String) -> Result<()> {
    
        /*
        We can access the tweet account via ctx.accounts.tweet. 
        Because we're using Rust, we also need to prefix this with & to access 
        the account by reference and mut to make sure we're allowed to mutate its data.
        */
        let tweet: &mut Account<Tweet> = &mut ctx.accounts.tweet;
        let author: &Signer = &ctx.accounts.author;
    
        /*
        Since the String type is a vector type and has no fixed limit, 
        we haven't made any restrictions on the number of characters the topic and 
        the content can have. We've only allocated the right amount of storage for them.
        Currently, nothing could stop a user from defining a topic of 280 characters and a 
        content of 50 characters. Even worse, since most characters only need one byte to 
        encode and nothing forces us to enter a topic, we could have a content 
        that is (280 + 50) * 4 = 1320 characters long.
        Therefore, if we want to protect ourselves from these scenarios, we need to add a few guards.
        */
        if topic.chars().count() > 50 {
            return Err(ErrorCode::TopicTooLong.into())
        }
    
        if content.chars().count() > 280 {
            return Err(error!(ErrorCode::ContentTooLong))
        }
    
        /*
        Note that we're using the unwrap() function because 
        Clock::get() returns a Result which can be Ok or Err. 
        Unwrapping a result means either using the value inside Ok — in our case, the clock —
        or immediately returning the error.
        */
        let clock: Clock = Clock::get().unwrap();
        // we can access public key of author via `author.key` but this contains
        // a reference to the public key so we need to dereference it using *
        tweet.author = *author.key;
        tweet.timestamp = clock.unix_timestamp;
        tweet.topic = topic;
        tweet.content = content;
    
        Ok(())
    }
    
    /* This function returns a ProgramResult which can either be Ok or ProgramError. 
    Rust does not have the concept of exceptions. Instead, you need to wrap your return 
    value into a special enum to tell the program if the execution was successful (Ok) 
    or not (Err and more specifically here ProgramError). Since we're not doing anything 
    inside that function for now, we immediately return Ok(()) which is an Ok type with no 
    return value inside (). Also, note that the last line of a function is used as the return 
    value without the need for a return keyword.
    */
}



#[error_code]
pub enum ErrorCode {
    #[msg("The provided topic should be 50 characters long maximum.")]
    TopicTooLong,
    #[msg("The provided content should be 280 characters long maximum.")]
    ContentTooLong,
}
