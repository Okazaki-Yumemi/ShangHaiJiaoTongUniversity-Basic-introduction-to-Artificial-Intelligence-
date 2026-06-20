# LLMshorthand(This chapter I didnt write too much,because I'm focusing on the LLM inference, so this chapter is ez for me, so I just write some notes for myself, and I will write more in the future if I have time)

# 1.why Transformer needs position embedding?

self-Attention only cares about the similarity between tokens, but it does not know the order of the tokens, so we need to add position embedding to the input tokens to let the model know the order of the tokens.

# 2.Temperature

Temperature controls the "sharpness" of the probability distribution of the next token. A higher temperature results in a more uniform distribution, making the model more likely to sample less probable tokens, while a lower temperature makes the distribution sharper, favoring more probable tokens.

> Temperature = 0: Greedy decoding, always choose the token with the highest probability.

> Temperature = 1: Sampling from the original distribution.

# 3. Autoregressive vs self-attention

Autoregressive is single directional, it generates the next token based on the previous tokens, while self-attention is bidirectional, it can attend to all tokens in the input sequence, allowing it to capture dependencies between tokens regardless of their position in the sequence.

>But actually, for GPT/Decoder only LLM, self-attention also means "causal self-attention", which is also single directional, it can only attend to the previous tokens, not the future tokens.

# 4.LLM input tackling process
```
text
-> Tokenization
-> Token IDs
-> Position Embedding
-> self-Attention
-> FFN  
-> linear layer
-> softmax
-> next token
```

# 5.Q K V
## 5.1 What are Q K V?
```
Q = Query , what information this token is looking for
K = Key , what information this token has
V = Value , the actual information this token has
```
## 5.2 Self-Attention formula
```
Attention(Q,K,V) = softmax(QK^T/sqrt(d_k))V
```
where d_k is the dimension of the key vectors.

```
QK^T : caculates similarity between tokens
softmax(QK^T/sqrt(d_k)) : caculates the attention weights
V : caculates the weighted sum of the values
```

## 6. what does attention is averaging the values mean?

if there is a token whose V is almost the same for any other tokens,
it means that the model doesnt know which token is more important.

And Attention is weakened to the average pooling.

## 7. Multihead Attention
Multihead Attention is a mechanism that allows the model to attend to different parts of the input sequence simultaneously, capturing different types of relationships between tokens. It does this by projecting the input into multiple sets of Q, K, and V matrices, each corresponding to a different "head". Each head performs self-attention independently, and their outputs are concatenated and linearly transformed to produce the final output.

## 8. Onehot vs Embedding
## 8.1 Onehot
> Weaknees: Assuming that the size of token vocabulary is V, then the onehot vector will have a size of V, which is very large and sparse. It also cannot capture the semantic meaning of the tokens.

## 8.2 Embedding
Embedding can make the saparate tokens have a semantic meaning, and the size of the embedding vector is much smaller than the onehot vector, which can reduce the computational cost and memory usage. It can also capture the semantic meaning of the tokens, which can improve the performance of the model.


## 9.Greedy Top-k Top-p Temperature
### 9.1 Greedy
Greedy decoding is a simple decoding strategy that always selects the token with the highest probability at each step. It is fast and easy to implement, but it can lead to suboptimal results, as it does not consider the overall context of the sequence.

### 9.2 Top-k
Top-k sampling is a decoding strategy that selects the next token from the top k most probable tokens, rather than considering all possible tokens. This allows for more diversity in the generated text, as it can sample from a wider range of tokens, while still maintaining some level of control over the output.

### 9.3 Top-p
Top-p sampling is a decoding strategy that selects the next token from the smallest set of tokens whose cumulative probability exceeds the threshold p. This allows for more dynamic and diverse text generation, as it adapts the number of tokens considered based on the probability distribution.

### 9.4 Temperature
Temperature is a hyperparameter that controls the randomness of the output. A higher temperature leads to more diverse and creative outputs, while a lower temperature results in more conservative and predictable outputs.

## 10.The essence of LLM
LLM just caculates the probability of tokens.

It didnt know "fact" or "truth", it just knows the probability of tokens.

### 10.2 SFT/RLHF
SFT (Supervised Fine-Tuning) and RLHF (Reinforcement Learning with Human Feedback) are techniques used to fine-tune LLMs to align with human preferences and values. SFT involves training the model on a dataset of human-labeled examples, while RLHF uses reinforcement learning to optimize the model's behavior based on feedback from human evaluators.

