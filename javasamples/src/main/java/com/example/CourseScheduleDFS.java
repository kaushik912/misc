package com.example;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Course Schedule solution using Topological Sort with Depth-First Search
 * (DFS).
 * 
 * Problem Statement:
 * There are a total of numCourses courses you have to take, labeled from 0 to
 * numCourses - 1.
 * Some courses may have prerequisites, for example, prerequisites[i] = [a, b]
 * which means you must take course b before course a.
 * 
 * Return the ordering of courses you should take to finish all courses.
 * If there are multiple valid answers, return any of them.
 * If it is impossible to finish all courses (due to a cycle), return an empty
 * array.
 */
public class CourseScheduleDFS {

    public int[] findOrder(int numCourses, int[][] prerequisites) {
        // Build adjacency list
        List<List<Integer>> adj = new ArrayList<>(numCourses);
        for (int i = 0; i < numCourses; i++) {
            adj.add(new ArrayList<>());
        }

        // Edge: b -> a (to take 'a', you must take 'b' first)
        for (int[] pre : prerequisites) {
            int course = pre[0];
            int prereq = pre[1];
            adj.get(prereq).add(course);
        }

        boolean[] visited = new boolean[numCourses];
        boolean[] onPath = new boolean[numCourses];
        List<Integer> topologicalOrder = new ArrayList<>();

        // Perform DFS from every unvisited node
        for (int i = 0; i < numCourses; i++) {
            if (!visited[i]) {
                if (!dfs(i, adj, visited, onPath, topologicalOrder)) {
                    // Cycle detected
                    return new int[0];
                }
            }
        }

        Collections.reverse(topologicalOrder);
        return topologicalOrder.stream().mapToInt(i -> i).toArray();
    }

    private boolean dfs(int node, List<List<Integer>> adj, boolean[] visited, boolean[] onPath,
            List<Integer> topologicalOrder) {
        visited[node] = true;
        onPath[node] = true;

        for (int neighbor : adj.get(node)) {
            if (onPath[neighbor]) {
                return false; // Cycle detected
            }
            if (!visited[neighbor]) {
                if (!dfs(neighbor, adj, visited, onPath, topologicalOrder)) {
                    return false;
                }
            }
        }

        onPath[node] = false; // Backtrack
        topologicalOrder.add(node);
        return true;
    }

    public static void main(String[] args) {
        CourseScheduleDFS solver = new CourseScheduleDFS();

        // Example 1: Valid course schedule
        // 4 courses: 0, 1, 2, 3
        // Prerequisites: [1,0] (0->1), [2,0] (0->2), [3,1] (1->3), [3,2] (2->3)
        int numCourses1 = 4;
        int[][] prerequisites1 = {
                { 1, 0 },
                { 2, 0 },
                { 3, 1 },
                { 3, 2 }
        };

        int[] order1 = solver.findOrder(numCourses1, prerequisites1);
        System.out.println("Example 1 Course Order: " + java.util.Arrays.toString(order1));

        // Example 2: Impossible schedule (Cycle exists: 0 -> 1 -> 0)
        int numCourses2 = 2;
        int[][] prerequisites2 = {
                { 1, 0 },
                { 0, 1 }
        };

        int[] order2 = solver.findOrder(numCourses2, prerequisites2);
        System.out.println("Example 2 Course Order (Cycle): " + java.util.Arrays.toString(order2));
    }
}
