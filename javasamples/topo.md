# Topological Sort (Course Schedule) — Plain English Blueprint

A DFS-based topological sort with cycle detection, easy to translate back into code.

## 1. Map the relationships
Create an adjacency list where each course points to the list of courses that depend on it (i.e., its children).

```
adj[prereq].add(course)
```

## 2. Track status
Keep track of every course with three states:

| State | Meaning |
|-------|---------|
| **Unvisited** | Not touched yet |
| **Visiting** | Currently being explored in the current DFS path (used to catch cycles) |
| **Visited** | Fully explored, along with all its downstream dependencies |

## 3. Visit every unvisited course
Loop through all courses. If a course is *Unvisited*, start a DFS dive from it.

```
for course in 0..numCourses-1:
    if states[course] == UNVISITED:
        if !dfs(course): return false  // cycle impossible
```

## 4. Detect cycles on the way down
Inside DFS:
- Mark the current course as *Visiting*.
- Look at all its neighbors:
  - If a neighbor is already *Visiting* → you looped back to an ancestor → **cycle detected**, return `false`.
  - If a neighbor is *Unvisited* → recursively call DFS on it.
  - If that recursive call returns `false`, bubble the `false` all the way up (short-circuit).

```
for neighbor in adj[node]:
    if states[neighbor] == VISITING: return false
    if states[neighbor] == UNVISITED:
        if !dfs(neighbor): return false
```

## 5. Collect in post-order
Once all neighbors of a course are successfully explored without cycles:
- Mark the current course as *Visited*.
- Add it to your order list.

```
states[node] = VISITED
order.add(node)
```

## 6. Reverse and finish
Because DFS adds nodes *after* their children are done, the list currently has the **end** of the dependency chain first. Reverse the list at the very end to get the correct course schedule (prerequisites first), then convert to an array.

```
Collections.reverse(order)
```

## Why it works
The "sort" happens at the **moment a node finishes exploring all its dependencies** (post-order). Leaves (no dependents) are recorded first; the final reverse flips the chain so courses with no prerequisites come first.
