package com.example;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

public class VirtualThreadExample {

    public static void main(String[] args) throws InterruptedException {
        System.out.println("=== Virtual Threads vs Platform Threads Performance Comparison ===");
        
        // Example 1: Using platform threads (traditional thread pool)
        System.out.println("\nRunning with platform threads...");
        runThreadTest(Executors.newFixedThreadPool(1000), "Platform Threads");
        
        // Example 2: Using virtual threads
        System.out.println("\nRunning with virtual threads...");
        runThreadTest(Executors.newVirtualThreadPerTaskExecutor(), "Virtual Threads");
    }

    private static void runThreadTest(ExecutorService executor, String testName) 
            throws InterruptedException {
        final int TASK_COUNT = 10_000;
        final AtomicInteger completedTasks = new AtomicInteger(0);
        
        Instant start = Instant.now();
        
        // Submit tasks
        for (int i = 0; i < TASK_COUNT; i++) {
            executor.submit(() -> {
                try {
                    // Simulate work (I/O operation)
                    Thread.sleep(10);
                    completedTasks.incrementAndGet();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }
        
        // Shutdown and wait for completion
        executor.shutdown();
        boolean finished = executor.awaitTermination(30, TimeUnit.SECONDS);
        
        Duration duration = Duration.between(start, Instant.now());
        
        System.out.println(testName + " results:");
        System.out.println("  Tasks completed: " + completedTasks.get() + "/" + TASK_COUNT);
        System.out.println("  Time taken: " + duration.toMillis() + "ms");
        System.out.println("  Thread pool class: " + executor.getClass().getSimpleName());
        
        if (!finished) {
            System.out.println("  WARNING: Not all tasks completed within timeout!");
        }
    }
}