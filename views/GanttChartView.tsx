import React from 'react';
import { RabItem } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { addDays } from '../constants';

interface GanttChartViewProps {
  items: RabItem[];
  startDate: string;
}

export default function GanttChartView({ items, startDate }: GanttChartViewProps) {
  const projectStartDate = new Date(startDate);
  const taskData = items.map(item => {
    let itemStartDate;
    if (item.dependsOn) {
      const predecessor = items.find(i => i.id === item.dependsOn);
      const predecessorStartDate = new Date(projectStartDate); // Simplified: assumes all dependencies start relative to project start for this mock
      // This is a simplification. A real Gantt would calculate dependency chains.
      const predecessorEndDate = addDays(predecessorStartDate, predecessor?.duration || 0);
      itemStartDate = addDays(predecessorEndDate, 1);
    } else {
      itemStartDate = projectStartDate;
    }
    const startDay = Math.round((itemStartDate.getTime() - projectStartDate.getTime()) / (1000 * 3600 * 24));
    return { ...item, startDay };
  });

  const projectDuration = Math.max(...taskData.map(t => t.startDay + (t.duration || 1)), 30);
  const dayHeaders = Array.from({ length: projectDuration }, (_, i) => i + 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Jadwal Proyek (Gantt Chart)</CardTitle>
        <CardDescription>Visualisasi timeline pekerjaan proyek.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-[250px,1fr] text-sm font-semibold text-center border-b-2 border-night-black">
            <div className="p-2 border-r border-violet-essence text-left">Nama Pekerjaan</div>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${projectDuration}, minmax(30px, 1fr))` }}>
              {dayHeaders.map(day => <div key={day} className="p-2 border-r border-violet-essence/50">{day}</div>)}
            </div>
          </div>
          <div className="divide-y divide-violet-essence">
            {taskData.map(task => (
              <div key={task.id} className="grid grid-cols-[250px,1fr] items-center">
                <div className="p-2 text-xs truncate">{task.uraian}</div>
                <div className="relative h-full grid" style={{ gridTemplateColumns: `repeat(${projectDuration}, minmax(30px, 1fr))` }}>
                  <div
                    className="h-6 bg-persimmon/80 rounded my-1 hover:bg-persimmon transition-all"
                    style={{
                      gridColumnStart: task.startDay + 1,
                      gridColumnEnd: `span ${task.duration || 1}`,
                    }}
                    title={`${task.uraian} (Hari ${task.startDay + 1} - ${task.startDay + (task.duration || 1)})`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
