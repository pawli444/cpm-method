export interface Task {
    id: string;
    duration: number;
    dependencies: string[];
}

export interface TaskResult extends Task {
    es: number;
    ef: number;
    ls: number;
    lf: number;
    reserve: number;
    isCritical: boolean;
}

export function calculateCPM(tasks: Task[]): TaskResult[] {
    const results: Record<string, TaskResult> = {};
    const adjList: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};

    tasks.forEach(t => {
        results[t.id] = { ...t, es: 0, ef: 0, ls: 0, lf: 0, reserve: 0, isCritical: false };
        if (!adjList[t.id]) adjList[t.id] = [];
        inDegree[t.id] = t.dependencies.length;

        t.dependencies.forEach(dep => {
            if (!adjList[dep]) adjList[dep] = [];
            adjList[dep].push(t.id);
        });
    });

    const queue: string[] = [];
    const topoOrder: string[] = [];

    tasks.forEach(t => {
        if (inDegree[t.id] === 0) queue.push(t.id);
    });

    while (queue.length > 0) {
        const curr = queue.shift()!;
        topoOrder.push(curr);

        adjList[curr].forEach(succ => {
            inDegree[succ]--;
            if (inDegree[succ] === 0) queue.push(succ);
        });
    }

    if (topoOrder.length !== tasks.length) {
        throw new Error("Wykryto pętlę w grafie! Sprawdź zależności.");
    }

    let projectDuration = 0;

    topoOrder.forEach(taskId => {
        const task = results[taskId];
        let maxDepEF = 0;
        task.dependencies.forEach(dep => {
            if (results[dep].ef > maxDepEF) {
                maxDepEF = results[dep].ef;
            }
        });
        task.es = maxDepEF;
        task.ef = task.es + task.duration;
        if (task.ef > projectDuration) {
            projectDuration = task.ef;
        }
    });

    topoOrder.forEach(taskId => {
        results[taskId].lf = projectDuration;
    });

    for (let i = topoOrder.length - 1; i >= 0; i--) {
        const taskId = topoOrder[i];
        const task = results[taskId];
        const successors = adjList[taskId];

        if (successors.length > 0) {
            let minSuccLS = Infinity;
            successors.forEach(succ => {
                if (results[succ].ls < minSuccLS) {
                    minSuccLS = results[succ].ls;
                }
            });
            task.lf = minSuccLS;
        } else {
            task.lf = projectDuration;
        }

        task.ls = task.lf - task.duration;
        task.reserve = task.lf - task.ef;
        task.isCritical = task.reserve === 0;
    }

    return topoOrder.map(id => results[id]);
}