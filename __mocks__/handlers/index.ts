/**
 * MSW Request Handlers
 * Mock API endpoints for testing
 */

import { http, HttpResponse } from 'msw';
import { 
  createMockUser, 
  createMockProject, 
  createMockTask,
  createMockDocument,
  createMockPurchaseOrder 
} from '../testDataFactory';

const API_BASE = process.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const handlers = [
  // User endpoints
  http.get(`${API_BASE}/users/:id`, ({ params }) => {
    return HttpResponse.json(createMockUser({ id: params.id as string }));
  }),

  http.get(`${API_BASE}/users`, () => {
    return HttpResponse.json([
      createMockUser({ id: '1', name: 'User 1' }),
      createMockUser({ id: '2', name: 'User 2' }),
      createMockUser({ id: '3', name: 'User 3' })
    ]);
  }),

  http.post(`${API_BASE}/users`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json(createMockUser(body), { status: 201 });
  }),

  // Project endpoints
  http.get(`${API_BASE}/projects/:id`, ({ params }) => {
    return HttpResponse.json(createMockProject({ id: params.id as string }));
  }),

  http.get(`${API_BASE}/projects`, () => {
    return HttpResponse.json([
      createMockProject({ id: '1', name: 'Project Alpha' }),
      createMockProject({ id: '2', name: 'Project Beta' }),
      createMockProject({ id: '3', name: 'Project Gamma' })
    ]);
  }),

  http.post(`${API_BASE}/projects`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json(createMockProject(body), { status: 201 });
  }),

  http.put(`${API_BASE}/projects/:id`, async ({ params, request }) => {
    const body = await request.json() as any;
    return HttpResponse.json(createMockProject({ id: params.id as string, ...body }));
  }),

  http.delete(`${API_BASE}/projects/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Task endpoints
  http.get(`${API_BASE}/tasks/:id`, ({ params }) => {
    return HttpResponse.json(createMockTask({ id: params.id as string }));
  }),

  http.get(`${API_BASE}/projects/:projectId/tasks`, ({ params }) => {
    return HttpResponse.json([
      createMockTask({ id: '1', projectId: params.projectId as string, title: 'Task 1' }),
      createMockTask({ id: '2', projectId: params.projectId as string, title: 'Task 2' }),
      createMockTask({ id: '3', projectId: params.projectId as string, title: 'Task 3' })
    ]);
  }),

  http.post(`${API_BASE}/tasks`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json(createMockTask(body), { status: 201 });
  }),

  // Document endpoints
  http.get(`${API_BASE}/documents/:id`, ({ params }) => {
    return HttpResponse.json(createMockDocument({ id: params.id as string }));
  }),

  http.get(`${API_BASE}/projects/:projectId/documents`, ({ params }) => {
    return HttpResponse.json([
      createMockDocument({ id: '1', projectId: params.projectId as string }),
      createMockDocument({ id: '2', projectId: params.projectId as string }),
      createMockDocument({ id: '3', projectId: params.projectId as string })
    ]);
  }),

  http.post(`${API_BASE}/documents`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json(createMockDocument(body), { status: 201 });
  }),

  // Purchase Order endpoints
  http.get(`${API_BASE}/purchase-orders/:id`, ({ params }) => {
    return HttpResponse.json(createMockPurchaseOrder({ id: params.id as string }));
  }),

  http.get(`${API_BASE}/purchase-orders`, () => {
    return HttpResponse.json([
      createMockPurchaseOrder({ id: '1', poNumber: 'PO-001' }),
      createMockPurchaseOrder({ id: '2', poNumber: 'PO-002' }),
      createMockPurchaseOrder({ id: '3', poNumber: 'PO-003' })
    ]);
  }),

  http.post(`${API_BASE}/purchase-orders`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json(createMockPurchaseOrder(body), { status: 201 });
  }),

  // Error scenarios
  http.get(`${API_BASE}/error/404`, () => {
    return new HttpResponse(null, { status: 404 });
  }),

  http.get(`${API_BASE}/error/500`, () => {
    return new HttpResponse(null, { status: 500 });
  }),

  http.get(`${API_BASE}/error/timeout`, async () => {
    await new Promise(resolve => setTimeout(resolve, 30000));
    return HttpResponse.json({});
  })
];
