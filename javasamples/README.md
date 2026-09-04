# JavaSamples: Course Schedule Topological Sort

A production-ready Java implementation of topological sorting using Depth-First Search (DFS) to solve the Course Schedule problem with cycle detection.

## Overview

**Problem**: Given a number of courses and their prerequisites, determine if you can complete all courses and, if so, return a valid course order.

**Solution**: Topological sort using DFS with three-state cycle detection (Unvisited → Visiting → Visited). Returns an empty array if circular dependencies exist, otherwise returns a valid course ordering.

**Time Complexity**: O(V + E) | **Space Complexity**: O(V + E)

## Prerequisites

- **Java**: 17 or higher
- **Maven**: 3.6 or higher

To verify your installation:
```bash
java -version
mvn -version
```

## Quick Start

### 1. Compile
```bash
mvn clean compile
```

### 2. Package
```bash
mvn package
```

### 3. Run
```bash
java -cp target/javasamples-1.0-SNAPSHOT.jar com.example.CourseScheduleDFS
```

Expected output:
```
Example 1 Course Order: [0, 1, 2, 3]
Example 2 Course Order (Cycle): []
```

## Directory Structure

```
javasamples/
├── src/
│   └── main/
│       └── java/
│           └── com/example/
│               └── CourseScheduleDFS.java       # Main implementation
├── pom.xml                                       # Maven build config
├── topo.md                                       # Algorithm blueprint (plain English)
└── README.md                                     # This file
```

## Key Component: CourseScheduleDFS

### Method Signature
```java
public int[] findOrder(int numCourses, int[][] prerequisites)
```

### Parameters
- **numCourses** `int`: Total number of courses (labeled 0 to numCourses-1)
- **prerequisites** `int[][]`: Array of [course, prerequisite] pairs
  - `[a, b]` means you must take course **b** before course **a**

### Returns
- **int[]**: Valid course order (prerequisites appear before their dependents) or empty array if impossible

### Usage Example

```java
CourseScheduleDFS solver = new CourseScheduleDFS();

// Example 1: Valid schedule with 4 courses
int[][] prereqs1 = {{1, 0}, {2, 0}, {3, 1}, {3, 2}};
//   Meaning: Take 0 before 1, take 0 before 2, take 1 before 3, take 2 before 3
int[] order1 = solver.findOrder(4, prereqs1);
// Possible output: [0, 1, 2, 3] or [0, 2, 1, 3]

// Example 2: Circular dependency (0 → 1 → 0)
int[][] prereqs2 = {{1, 0}, {0, 1}};
int[] order2 = solver.findOrder(2, prereqs2);
// Output: [] (empty, impossible to schedule)
```

## Algorithm Details

### Three-State Tracking

Each course has one of three states during traversal:

| State | Meaning |
|-------|---------|
| **Unvisited** | Never encountered yet |
| **Visiting** | Currently being explored in the DFS path (used to detect cycles) |
| **Visited** | Fully explored, all dependencies processed |

### Algorithm Steps

1. **Build Graph**: Create an adjacency list where `prereq → [courses that depend on it]`
2. **Traverse**: For each unvisited course, initiate a DFS dive
3. **Detect Cycles**: If a neighbor is already "Visiting" in current path → cycle found
4. **Post-order Collection**: Add nodes to result after all descendants are processed
5. **Reverse**: Reverse the result to get correct prerequisite ordering

### Pseudocode
```
for each unvisited course:
    if DFS(course) returns false (cycle detected):
        return []

DFS(node):
    mark node as VISITING
    for each neighbor in node's dependencies:
        if neighbor is VISITING: return false  // cycle!
        if neighbor is UNVISITED:
            if DFS(neighbor) returns false: return false
    mark node as VISITED
    add node to result
    return true

reverse result and return
```

### Performance Analysis

**Time Complexity**: O(V + E)
- V = number of courses (vertices)
- E = number of prerequisites (edges)
- Single DFS traversal visits each node and edge exactly once

**Space Complexity**: O(V + E)
- Adjacency list storage: O(V + E)
- Recursion stack: O(V) worst case
- Boolean arrays: O(V)

## Build Configuration

Maven settings in `pom.xml`:

| Property | Value | Purpose |
|----------|-------|---------|
| `maven.compiler.source` | 17 | Source code Java version |
| `maven.compiler.target` | 17 | Target bytecode Java version |
| Main-Class | `com.example.CourseScheduleDFS` | JAR entry point |

Plugins configured:
- **maven-compiler-plugin** (3.11.0): Java 17 compilation
- **maven-jar-plugin** (3.3.0): JAR packaging with manifest

## Testing

### Run Built-in Examples
```bash
java -cp target/javasamples-1.0-SNAPSHOT.jar com.example.CourseScheduleDFS
```

### Add Custom Test Cases
Modify the `main()` method in `CourseScheduleDFS.java`:

```java
// Your custom example
int numCourses = 5;
int[][] prerequisites = {{1, 0}, {2, 1}, {3, 2}};
int[] order = solver.findOrder(numCourses, prerequisites);
System.out.println("Result: " + Arrays.toString(order));
```

## Use Cases

- **University Course Planning**: Ensure prerequisites are taken in correct order
- **Build Dependency Management**: Determine compilation order for modules
- **Task Scheduling**: Order tasks when some depend on others
- **Package Installation**: Install packages respecting dependency chains

## Implementation Notes

- **Thread Safety**: Current implementation is not thread-safe; synchronize if using in multi-threaded environment
- **Stability**: Multiple valid orderings may exist; any valid ordering is acceptable
- **Stack Depth**: Deep course chains may cause stack overflow; consider iterative approach for very large graphs

## Common Issues

### Empty Array Result
- Likely cause: Circular dependency detected
- Verify prerequisites don't form a cycle: `a → b → ... → a`

### ClassNotFoundException
- Ensure JAR file was built: `mvn package`
- Verify correct class path in java command

### Compilation Errors
- Verify Java 17+: `java -version`
- Check Maven installation: `mvn -version`

## Algorithm References

See `topo.md` for a detailed plain-English blueprint of the topological sort algorithm and DFS logic.

## License

Sample code for educational purposes.
