from collections import defaultdict

### ```Sample Topological Sort using DFS```
def build_graph(edges):
    graph = defaultdict(list)
    for u, v in edges:
        graph[u].append(v)
    return graph


def topo_sort(n, graph):
    visited = [False] * n
    on_path = [False] * n
    order = []

    def dfs(u):
        visited[u] = True
        on_path[u] = True
        for v in graph[u]:
            if on_path[v]:
                raise ValueError(f"cycle detected: {u} -> {v}")
            if not visited[v]:
                dfs(v)
        on_path[u] = False
        order.append(u)

    for u in range(n):
        if not visited[u]:
            dfs(u)

    return order[::-1]


if __name__ == "__main__":
    n = 6
    edges = [
        (5, 2),
        (5, 0),
        (4, 0),
        (4, 1),
        (2, 3),
        (3, 1),
    ]
    # n=2;
    # edges = [(0, 1),(1, 0)]
    graph = build_graph(edges)

    print("Prepopulated adjacency list:")
    for u in range(n):
        print(f"  {u}: {graph[u]}")
    print()

    try:
        order = topo_sort(n, graph)
        print("Topological order:", order)
    except ValueError as e:
        print("Error:", e)
