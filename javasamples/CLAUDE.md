# javasamples

Java algorithm/concurrency samples. Plain Maven, no Spring, no deps, no tests dir.

## Stack
- Java 17 (maven.compiler source/target), Maven 3.6+. No mvnw; use `mvn`.
- groupId `com.example`, artifact `javasamples` 1.0-SNAPSHOT.

## Commands
- Compile: `mvn clean compile`
- Package: `mvn package`
- Run: `java -cp target/javasamples-1.0-SNAPSHOT.jar com.example.CourseScheduleDFS`
- Other main: `com.example.VirtualThreadExample`

## Layout
- `src/main/java/com/example/CourseScheduleDFS.java` - topological sort (DFS, 3-state cycle detect), `findOrder(numCourses, prereqs)`; returns empty array on cycle.
- `src/main/java/com/example/VirtualThreadExample.java` - virtual threads demo.
- `topo.md` - plain-English algo blueprint; `README.md` - usage.

## Gotchas
- pom `maven-jar-plugin` mainClass = `com.example.TopologicalSort`, class does not exist. `java -jar` won't work; use `-cp` + class name.
- No ports, env vars, Docker.
