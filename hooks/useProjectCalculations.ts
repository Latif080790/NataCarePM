import { useMemo } from 'react';
import { Project, ProjectMetrics } from '../types';

const addDays = (date: Date, days: number) => { const result = new Date(date); result.setDate(result.getDate() + days); return result; };

export const useProjectCalculations = (
    project: Project | null,
): { projectMetrics: ProjectMetrics } => {

    const projectMetrics = useMemo((): ProjectMetrics => {
        if (!project || !project.items) {
            return {
                totalBudget: 0, actualCost: 0, plannedValue: 0, earnedValue: 0, remainingBudget: 0, overallProgress: 0,
                evm: { cpi: 1, spi: 1, sv: 0, cv: 0 },
                sCurveData: { planned: [], actual: [] }
            };
        }

        const startDate = new Date(project.startDate);
        const totalBudget = project.items.reduce((sum, item) => sum + item.volume * item.hargaSatuan, 0);
        const actualCost = project.expenses.reduce((sum, expense) => sum + expense.amount, 0);

        const completedVolumeMap = new Map<number, number>();
        project.dailyReports.forEach(report => {
            report.workProgress.forEach(progress => {
                const currentVolume = completedVolumeMap.get(progress.rabItemId) || 0;
                completedVolumeMap.set(progress.rabItemId, currentVolume + progress.completedVolume);
            });
        });

        const earnedValue = project.items.reduce((sum, item) => {
            const completedVolume = completedVolumeMap.get(item.id) || 0;
            const itemProgressValue = (completedVolume / item.volume) * (item.volume * item.hargaSatuan);
            return sum + (isNaN(itemProgressValue) ? 0 : itemProgressValue);
        }, 0);

        // S-Curve and Duration Calculation
        const taskEndDays = new Map<number, number>();
        const sortedItems = [...project.items].sort((a, b) => a.id - b.id);
        let maxDuration = 0;

        sortedItems.forEach(item => {
            let startDay = 0;
            if (item.dependsOn && taskEndDays.has(item.dependsOn)) {
                startDay = taskEndDays.get(item.dependsOn)!;
            }
            const endDay = startDay + (item.duration || 1);
            taskEndDays.set(item.id, endDay);
            if (endDay > maxDuration) {
                maxDuration = endDay;
            }
        });
        const projectDuration = maxDuration;
        
        // Corrected PV calculation
        const today = new Date();
        const daysElapsed = Math.max(0, (today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
        const timeProgress = projectDuration > 0 ? Math.min(1, daysElapsed / projectDuration) : 0;
        const plannedValue = totalBudget * timeProgress;

        const cv = earnedValue - actualCost;
        const sv = earnedValue - plannedValue;
        const cpi = actualCost > 0 ? earnedValue / actualCost : 1;
        const spi = plannedValue > 0 ? earnedValue / plannedValue : 1;

        const overallProgress = totalBudget > 0 ? (earnedValue / totalBudget) * 100 : 0;
        const remainingBudget = totalBudget - actualCost;

        // Generate S-Curve Data Points
        const dailyPlannedCosts = Array(projectDuration + 1).fill(0);
        taskEndDays.clear(); // Recalculate for cost distribution

        sortedItems.forEach(item => {
            let startDay = 0;
            if (item.dependsOn && taskEndDays.has(item.dependsOn)) {
                startDay = taskEndDays.get(item.dependsOn)!;
            }
            const endDay = startDay + (item.duration || 1);
            taskEndDays.set(item.id, endDay);

            const itemCost = item.volume * item.hargaSatuan;
            const duration = item.duration || 1;
            const dailyCost = itemCost / duration;

            for (let i = 0; i < duration; i++) {
                const dayIndex = startDay + i;
                if (dayIndex < dailyPlannedCosts.length) {
                    dailyPlannedCosts[dayIndex] += dailyCost;
                }
            }
        });

        const plannedSCurve: { day: number, cost: number }[] = [];
        let cumulativePlannedCost = 0;
        dailyPlannedCosts.forEach((cost, day) => {
            cumulativePlannedCost += cost;
            plannedSCurve.push({ day, cost: cumulativePlannedCost });
        });
        
        const actualSCurve: { day: number, cost: number }[] = [];
        let cumulativeActualCost = 0;
        const sortedExpenses = [...project.expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const expenseMap = new Map<number, number>();
        sortedExpenses.forEach(expense => {
            const expenseDate = new Date(expense.date);
            const day = Math.max(0, Math.floor((expenseDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)));
            expenseMap.set(day, (expenseMap.get(day) || 0) + expense.amount);
        });

        const todayDay = Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 3600 * 24));
        const maxExpenseDay = Math.max(...Array.from(expenseMap.keys()), 0);
        const lastDay = Math.max(todayDay, maxExpenseDay, 0);

        for(let day = 0; day <= lastDay; day++) {
            cumulativeActualCost += expenseMap.get(day) || 0;
            actualSCurve.push({ day, cost: cumulativeActualCost });
        }

        return {
            totalBudget,
            actualCost,
            plannedValue,
            earnedValue,
            remainingBudget,
            overallProgress,
            evm: { cpi, spi, sv, cv },
            sCurveData: { planned: plannedSCurve, actual: actualSCurve }
        };

    }, [project]);

    return { projectMetrics };
};