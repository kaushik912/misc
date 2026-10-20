package com.streams.example;

import java.util.*;
import java.util.Map.Entry;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/*


#### The 2 Hard Exercises

* **Exercise 9: Top-2 Most Expensive Books per Genre**
* **Goal:** Group books by genre, but for each genre, keep only a `List<Book>` containing the **top 2 most expensive books** sorted by price descending.
* *Hint:* You will want to use `Collectors.collectingAndThen()` where the downstream collector collects into a list, and the finisher sorts that list and applies `.limit(2)`.


* **Exercise 10: Genre Price Range Summary**
* **Goal:** Create a map of Genre to a custom formatted `String` that shows the price spread, e.g., `"Programming: Min=$40.0, Max=$50.0, Spread=$10.0"` using `Collectors.summarizingDouble()` combined with `collectingAndThen()`.

---
 */

public class StreamExercisesHard {
    public record Book(String title, String author, String genre, double price) {
    }

    public static void main(String[] args) {
        List<Book> books = List.of(
                new Book("Java Concurrency", "Brian Goetz", "Programming", 45.0),
                new Book("Effective Java", "Joshua Bloch", "Programming", 50.0),
                new Book("Clean Code", "Robert Martin", "Programming", 40.0),
                new Book("Atomic Habits", "James Clear", "Self-Help", 25.0),
                new Book("Deep Work", "Cal Newport", "Self-Help", 30.0),
                new Book("The Pragmatic Programmer", "Dave Thomas", "Programming", 48.0));

        Map<String, List<Book>> booksByGenre = books.stream()
                .collect(Collectors.groupingBy(Book::genre));

        Map<String, List<Book>> top2MaxPriceByGenre = 
                booksByGenre.entrySet().stream()
                .collect(Collectors.toMap
                    (Map.Entry::getKey,
                        entry -> entry.getValue()
                        .stream()
                        .sorted(Comparator.comparingDouble(Book::price)
                        .reversed())
                        .limit(2)
                        .collect(Collectors.toList())));
        System.out.println(top2MaxPriceByGenre);

        Map<String, List<Book>> top2Map = books.stream()
                .collect(
                    Collectors.groupingBy(
                        Book::genre, Collectors.collectingAndThen(
                        Collectors.toList(),
                        list -> list.stream()
                                .sorted(Comparator.comparingDouble(Book::price)
                                .reversed())
                                .limit(2)
                                .collect(Collectors.toList()))));
        System.out.println(top2Map);
        
        // P2 genre spread 
        //using built-in summary stas
        Map<String, String> summaryByGenre = booksByGenre.entrySet().stream().collect(
            Collectors.toMap(Map.Entry::getKey, 
                entry -> entry.getValue().stream().mapToDouble(Book::price).summaryStatistics().toString()));
        System.out.println(summaryByGenre);
        
        //using my own custom string
         Map<String, String> summaryByGenre2 = booksByGenre.entrySet().stream().collect(
            Collectors.toMap(Map.Entry::getKey, 
                entry -> {
                    DoubleSummaryStatistics stats = entry.getValue().stream().mapToDouble(Book::price).summaryStatistics();
                    String custom = String.format("Min=$%.1f, Max=$%.1f, Spread=$%.1f", stats.getMin(),stats.getMax(),stats.getMax() - stats.getMin());
                    return custom;
                }));
        System.out.println(summaryByGenre2);

        //harder one in one single pass
        Map<String, String> summaryByGenreSinglePass = books.stream()
        .collect(Collectors.groupingBy(Book::genre, Collectors.collectingAndThen(Collectors.toList(), list -> {
            DoubleSummaryStatistics stats = list.stream().mapToDouble(Book::price).summaryStatistics();
            String custom = String.format("Min=$%.1f, Max=$%.1f, Spread=$%.1f", stats.getMin(),stats.getMax(),stats.getMax() - stats.getMin());
            return custom;
        })));
        System.out.println(summaryByGenreSinglePass);

        //Even more compressed!
        Map<String, String> summaryByGenreSinglePass2 = books.stream()
        .collect(Collectors.groupingBy(Book::genre, Collectors.collectingAndThen(Collectors.summarizingDouble(Book::price), stats -> {
            String custom = String.format("Min=$%.1f, Max=$%.1f, Spread=$%.1f", stats.getMin(),stats.getMax(),stats.getMax() - stats.getMin());
            return custom;
        })));
        System.out.println(summaryByGenreSinglePass2);

    }

}