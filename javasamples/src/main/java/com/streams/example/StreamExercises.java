package com.streams.example;

import java.util.*;
import java.util.stream.Collectors;

/*

### The 3 Easy Exercises

#### Exercise 1: Total Price per Genre

* **Goal:** Calculate the total monetary sum of all books in each genre.
* **Collector to use:** `Collectors.groupingBy(..., Collectors.summingDouble(...))`
* **Expected Output Example:** `\{Programming=183.0, Self-Help=55.0\}`

#### Exercise 2: Book Titles by Author

* **Goal:** Create a map where the key is the author's name and the value is a single `String` containing all of their book titles joined by a comma and a space (`, `).
* **Collectors to use:** `Collectors.groupingBy(..., Collectors.mapping(..., Collectors.joining(", ")))`
* **Expected Output Example:** `\{Brian Goetz=Java Concurrency, Joshua Bloch=Effective Java, ...\}`

#### Exercise 3: Price Partitioning

* **Goal:** Partition the books into two groups: those priced **greater than $40** (`true`) and those priced **$40 or less** (`false`).
* **Collector to use:** `Collectors.partitioningBy(...)`
* **Expected Output Example:** `\{false=[Atomic Habits, Deep Work, Clean Code], true=[Java Concurrency, Effective Java, The Pragmatic Programmer]\}`

---
 */

public class StreamExercises {
    public record Book(String title, String author, String genre, double price) {}

    public static void main(String[] args) {
        List<Book> books = List.of(
            new Book("Java Concurrency", "Brian Goetz", "Programming", 45.0),
            new Book("Effective Java", "Joshua Bloch", "Programming", 50.0),
            new Book("Clean Code", "Robert Martin", "Programming", 40.0),
            new Book("Atomic Habits", "James Clear", "Self-Help", 25.0),
            new Book("Deep Work", "Cal Newport", "Self-Help", 30.0),
            new Book("The Pragmatic Programmer", "Dave Thomas", "Programming", 48.0)
        );

        // TODO: Try the exercises below here!
        Map<String, Double> totalPricePerGenre = books.stream().collect(Collectors.groupingBy(Book::genre,Collectors.summingDouble(Book::price)));
        System.out.println(totalPricePerGenre);

        Map<String, String> authorTitles = books.stream().collect(Collectors.groupingBy(Book::author, Collectors.mapping(Book::title,Collectors.joining(","))));
        System.out.println(authorTitles);

        Map<Boolean, List<Book>> fortyDollarPriceSplit = books.stream().collect(Collectors.partitioningBy(book-> book.price()>40));
        System.out.println(fortyDollarPriceSplit);

    }
    
}