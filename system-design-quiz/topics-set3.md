The interviewer said: Design a Payment Processing System. Handle 10,000 transactions per second.

→ What happens if your database goes down mid-transaction?
→ What if the same payment request reaches your server twice due to a network retry?

I failed that round. 34 LPA gone. But I didn't move on. I went deeper.
Here's what I should have said, The naive approach (what everyone says):
→ User clicks Pay
→ API receives the request
→ Deduct balance from the DB
→ Return success
This works in a demo. It fails at production scale.

The real problems at scale:
1. Duplicate Payments (Idempotency Failure) Network timeout. User clicks Pay twice. Or your retry mechanism triggers automatically. The same payment gets processed twice.
𝗙𝗶𝘅: Generate a unique idempotency key for every transaction. Before processing, verify whether the key already exists. If yes → return the previous result. Never process it again.

2. Partial Failure (Transaction Failure) Step 1: Deduct from sender Step 2: Credit to receiver (DB crashes).
𝗙𝗶𝘅: Use database ACID transactions with rollback. For distributed systems, implement the Saga pattern, where each step has a compensating action to reverse the operation if a failure occurs.

3. 10,000 TPS hitting one database Your single DB becomes the bottleneck.
𝗙𝗶𝘅: Separate read and write workloads (CQRS pattern). Use an event queue like Kafka between services. Process payments asynchronously accept the request quickly and handle settlement in the background.

The architecture I should have led with:
User → API Gateway → Kafka Queue → Payment Service
→ Idempotency Check (Redis)
→ DB Transaction (Saga)
→ Notification Service
→ API Gateway handles authentication and rate limiting
→ Kafka absorbs traffic spikes without directly overwhelming the DB
→ Redis enables O(1) idempotency checks
→ Saga pattern handles partial failures with compensating actions
→ Async notifications ensure the payment flow doesn't wait
