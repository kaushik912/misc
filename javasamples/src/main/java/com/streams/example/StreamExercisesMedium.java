package com.streams.example;

import java.util.*;
import java.util.Map.Entry;
import java.util.stream.Collectors;

/*


#### The 5 Medium Exercises

4. **Average Price per Genre:** Compute the average book price for each genre using `Collectors.averagingDouble()`.
5. **Top Book per Author:** Find the single most expensive book written by each author using `groupingBy()` combined with `Collectors.maxBy()` (handling or unwrapping the `Optional` nicely).
6. **Unique Genres per Author:** Group books by author and get a `Set` of all unique genres they have published in using `Collectors.mapping()` and `Collectors.toSet()`.
7. **Summary Statistics per Genre:** Generate full statistical metrics (count, sum, min, max, average) for book prices per genre using `Collectors.summarizingDouble()`.
8. **Multi-Level Grouping:** Group books first by **Genre**, and then nested inside by **Author** (`Map<String, List<Book Map<String,>>>`).

---
 */

public class StreamExercisesMedium {
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

        //pb1
        Map<String, Double> avgBookPricePerGenre = books.stream().collect(Collectors.groupingBy(Book::genre, Collectors.averagingDouble(Book::price)));
        System.out.println(avgBookPricePerGenre);

        //Slightly hard to remember, esp. the collectingAndThen()
       Map<String, String> maxBookTitlePerAuthor = books.stream().collect(Collectors.groupingBy(Book::author,
        Collectors.collectingAndThen(Collectors.maxBy(Comparator.comparingDouble(Book::price)),optionalBook -> optionalBook.map(Book::title).orElse("No books found"))));
       System.out.println(maxBookTitlePerAuthor);

         Map<String, Optional<Book>> maxPricedBookPerAuthor = books.stream().collect(Collectors.groupingBy(Book::author,Collectors.maxBy(Comparator.comparingDouble(Book::price))));
         Map<String, String> maxBookPricedTitlePerAuthor = maxPricedBookPerAuthor
         .entrySet()
         .stream()
         .collect(Collectors.toMap(Entry::getKey, entry -> entry.getValue().map(Book::title).orElse("No book found")));
        System.out.println(maxBookPricedTitlePerAuthor);

        //prb3
        Map<String, Set<String>> authorToGenresMap = books.stream().collect(Collectors.groupingBy(Book::author,Collectors.mapping(Book::genre,Collectors.toSet())));
        System.out.println(authorToGenresMap);

    //pb4
      Map<String, DoubleSummaryStatistics> pricingSummaryByGenre = books.stream().collect(Collectors.groupingBy(Book::genre,Collectors.summarizingDouble(Book::price)));
      System.out.println(pricingSummaryByGenre);
    
    //pb5
    Map<String, Map<String, List<Book>>> byGenreByAuthorBooks = books.stream().collect(Collectors.groupingBy(Book::genre,Collectors.groupingBy(Book::author)));
    System.out.println(byGenreByAuthorBooks);

    }
    
}