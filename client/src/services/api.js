import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setCredentials, logOut } from '../store/authSlice';

export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl;
  }
  let hostname = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
  if (hostname === 'localhost') {
    hostname = '127.0.0.1';
  }
  return `http://${hostname}:5000/api`;
};

const baseQuery = fetchBaseQuery({
  baseUrl: getApiBaseUrl(),
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Custom base query that intercepts 401 errors and attempts to refresh token
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401 && result.error.data?.code === 'TOKEN_EXPIRED') {
    // try to get a new access token using refresh token cookie
    const refreshResult = await baseQuery(
      { url: '/auth/refresh-token', method: 'POST' },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      // store the new token
      api.dispatch(setCredentials({ token: refreshResult.data.token }));
      // retry the original query
      result = await baseQuery(args, api, extraOptions);
    } else {
      // refresh failed, log out
      api.dispatch(logOut());
    }
  }
  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Employee',
    'Department',
    'Attendance',
    'Leave',
    'Payroll',
    'Job',
    'Candidate',
    'Interview',
    'Goal',
    'Review',
    'Announcement',
    'Document',
    'Notification',
    'Dashboard'
  ],
  endpoints: (builder) => ({
    // Auth
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),
    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    forgotPassword: builder.mutation({
      query: (body) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body,
      }),
    }),
    verifyOtp: builder.mutation({
      query: (body) => ({
        url: '/auth/verify-otp',
        method: 'POST',
        body,
      }),
    }),
    resetPassword: builder.mutation({
      query: (body) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body,
      }),
    }),

    // Dashboard
    getDashboardMetrics: builder.query({
      query: () => '/portal/dashboard/metrics',
      providesTags: ['Dashboard'],
    }),

    // Employees
    getEmployees: builder.query({
      query: (params) => ({
        url: '/hr/employees',
        params,
      }),
      providesTags: ['Employee'],
    }),
    getEmployeeById: builder.query({
      query: (id) => `/hr/employees/${id}`,
      providesTags: (result, error, id) => [{ type: 'Employee', id }],
    }),
    createEmployee: builder.mutation({
      query: (body) => ({
        url: '/hr/employees',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Employee', 'Dashboard'],
    }),
    updateEmployee: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/hr/employees/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => ['Employee', { type: 'Employee', id }, 'Dashboard'],
    }),
    bulkEmployeeAction: builder.mutation({
      query: (body) => ({
        url: '/hr/employees/bulk',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Employee', 'Dashboard'],
    }),
    getOrgChart: builder.query({
      query: () => '/hr/employees/org-chart',
      providesTags: ['Employee'],
    }),

    // Departments
    getDepartments: builder.query({
      query: () => '/hr/departments',
      providesTags: ['Department'],
    }),
    getDepartmentById: builder.query({
      query: (id) => `/hr/departments/${id}`,
      providesTags: ['Department'],
    }),
    createDepartment: builder.mutation({
      query: (body) => ({
        url: '/hr/departments',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Department'],
    }),
    updateDepartment: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/hr/departments/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Department'],
    }),
    deleteDepartment: builder.mutation({
      query: (id) => ({
        url: `/hr/departments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Department'],
    }),

    // Attendance
    checkIn: builder.mutation({
      query: (body) => ({
        url: '/attendance/checkin',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Attendance', 'Dashboard'],
    }),
    checkOut: builder.mutation({
      query: () => ({
        url: '/attendance/checkout',
        method: 'POST',
      }),
      invalidatesTags: ['Attendance', 'Dashboard'],
    }),
    getAttendance: builder.query({
      query: (params) => ({
        url: '/attendance',
        params,
      }),
      providesTags: ['Attendance'],
    }),
    getAttendanceSummary: builder.query({
      query: ({ employeeId, month, year }) => `/attendance/summary/${employeeId}/${month}/${year}`,
      providesTags: ['Attendance'],
    }),
    getTodayPresent: builder.query({
      query: () => '/attendance/today/present',
      providesTags: ['Attendance', 'Dashboard'],
    }),
    regularizeAttendance: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/attendance/${id}/regularize`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Attendance'],
    }),
    approveRegularization: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/attendance/${id}/approve-regularization`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Attendance', 'Dashboard'],
    }),
    bulkImportAttendance: builder.mutation({
      query: (body) => ({
        url: '/attendance/bulk-import',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Attendance', 'Dashboard'],
    }),

    // Leaves
    getLeaveBalance: builder.query({
      query: (employeeId) => `/leaves/balance/${employeeId}`,
      providesTags: ['Leave'],
    }),
    applyLeave: builder.mutation({
      query: (body) => ({
        url: '/leaves/apply',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Leave', 'Dashboard'],
    }),
    getLeaveApplications: builder.query({
      query: () => '/leaves/applications',
      providesTags: ['Leave'],
    }),
    approveRejectLeave: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/leaves/approve/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Leave', 'Dashboard'],
    }),
    getTodayOnLeave: builder.query({
      query: () => '/leaves/today',
      providesTags: ['Leave', 'Dashboard'],
    }),
    getLeaveCalendar: builder.query({
      query: ({ month, year }) => `/leaves/calendar/${month}/${year}`,
      providesTags: ['Leave'],
    }),

    // Payroll
    getSalaryStructure: builder.query({
      query: (employeeId) => `/payroll/salary/${employeeId}`,
      providesTags: ['Payroll'],
    }),
    updateSalaryStructure: builder.mutation({
      query: ({ employeeId, ...body }) => ({
        url: `/payroll/salary/${employeeId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Payroll'],
    }),
    getPayrollDashboard: builder.query({
      query: () => '/payroll/dashboard',
      providesTags: ['Payroll'],
    }),
    runPayroll: builder.mutation({
      query: (body) => ({
        url: '/payroll/run',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Payroll'],
    }),
    updatePayrollStatus: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/payroll/status/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Payroll', 'Dashboard'],
    }),
    getPayslip: builder.query({
      query: (id) => `/payroll/payslip/${id}`,
      providesTags: ['Payroll'],
    }),
    getPayrollReports: builder.query({
      query: () => '/payroll/reports',
      providesTags: ['Payroll'],
    }),
    getPayrollRuns: builder.query({
      query: (params) => ({
        url: '/payroll',
        params,
      }),
      providesTags: ['Payroll'],
    }),

    // Recruitment
    getJobs: builder.query({
      query: () => '/recruitment/jobs',
      providesTags: ['Job'],
    }),
    createJob: builder.mutation({
      query: (body) => ({
        url: '/recruitment/jobs',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Job', 'Dashboard'],
    }),
    updateJob: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/recruitment/jobs/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Job'],
    }),
    getCandidates: builder.query({
      query: (params) => ({
        url: '/recruitment/candidates',
        params,
      }),
      providesTags: ['Candidate'],
    }),
    createCandidate: builder.mutation({
      query: (body) => ({
        url: '/recruitment/candidates',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Candidate', 'Job'],
    }),
    updateCandidateStage: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/recruitment/candidates/${id}/stage`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Candidate'],
    }),
    addCandidateNote: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/recruitment/candidates/${id}/note`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Candidate'],
    }),
    getInterviews: builder.query({
      query: () => '/recruitment/interviews',
      providesTags: ['Interview'],
    }),
    scheduleInterview: builder.mutation({
      query: (body) => ({
        url: '/recruitment/interviews',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Interview', 'Candidate'],
    }),
    submitInterviewFeedback: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/recruitment/interviews/${id}/feedback`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Interview', 'Candidate'],
    }),
    sendOfferLetter: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/recruitment/candidates/${id}/offer`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Candidate'],
    }),

    // Performance
    getGoals: builder.query({
      query: (params) => ({
        url: '/performance/goals',
        params,
      }),
      providesTags: ['Goal'],
    }),
    createGoal: builder.mutation({
      query: (body) => ({
        url: '/performance/goals',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Goal'],
    }),
    updateGoalProgress: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/performance/goals/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Goal'],
    }),
    getReviews: builder.query({
      query: (params) => ({
        url: '/performance/reviews',
        params,
      }),
      providesTags: ['Review'],
    }),
    createReviewCycle: builder.mutation({
      query: (body) => ({
        url: '/performance/reviews/cycle',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Review'],
    }),
    submitReview: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/performance/reviews/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Review'],
    }),
    acknowledgeReview: builder.mutation({
      query: ({ id }) => ({
        url: `/performance/reviews/${id}/acknowledge`,
        method: 'PUT',
      }),
      invalidatesTags: ['Review'],
    }),

    // Portal (Announcements, Documents, Notifications)
    getAnnouncements: builder.query({
      query: () => '/portal/announcements',
      providesTags: ['Announcement'],
    }),
    createAnnouncement: builder.mutation({
      query: (body) => ({
        url: '/portal/announcements',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Announcement', 'Dashboard'],
    }),
    commentAnnouncement: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/portal/announcements/${id}/comment`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Announcement'],
    }),
    reactAnnouncement: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/portal/announcements/${id}/react`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Announcement'],
    }),
    getDocuments: builder.query({
      query: () => '/portal/documents',
      providesTags: ['Document'],
    }),
    uploadDocument: builder.mutation({
      query: (formData) => ({
        url: '/portal/documents/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Document', 'Employee'],
    }),
    verifyDocument: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/portal/documents/${id}/verify`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Document', 'Employee', 'Dashboard'],
    }),
    getNotifications: builder.query({
      query: () => '/portal/notifications',
      providesTags: ['Notification'],
    }),
    markNotificationsRead: builder.mutation({
      query: () => ({
        url: '/portal/notifications/read',
        method: 'PUT',
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useForgotPasswordMutation,
  useVerifyOtpMutation,
  useResetPasswordMutation,
  useGetDashboardMetricsQuery,
  useGetEmployeesQuery,
  useGetEmployeeByIdQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useBulkEmployeeActionMutation,
  useGetOrgChartQuery,
  useGetDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useCheckInMutation,
  useCheckOutMutation,
  useGetAttendanceQuery,
  useGetAttendanceSummaryQuery,
  useGetTodayPresentQuery,
  useRegularizeAttendanceMutation,
  useApproveRegularizationMutation,
  useBulkImportAttendanceMutation,
  useGetLeaveBalanceQuery,
  useApplyLeaveMutation,
  useGetLeaveApplicationsQuery,
  useApproveRejectLeaveMutation,
  useGetTodayOnLeaveQuery,
  useGetLeaveCalendarQuery,
  useGetSalaryStructureQuery,
  useUpdateSalaryStructureMutation,
  useGetPayrollDashboardQuery,
  useRunPayrollMutation,
  useUpdatePayrollStatusMutation,
  useGetPayslipQuery,
  useGetPayrollReportsQuery,
  useGetPayrollRunsQuery,
  useGetJobsQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useGetCandidatesQuery,
  useCreateCandidateMutation,
  useUpdateCandidateStageMutation,
  useAddCandidateNoteMutation,
  useGetInterviewsQuery,
  useScheduleInterviewMutation,
  useSubmitInterviewFeedbackMutation,
  useSendOfferLetterMutation,
  useGetGoalsQuery,
  useCreateGoalMutation,
  useUpdateGoalProgressMutation,
  useGetReviewsQuery,
  useCreateReviewCycleMutation,
  useSubmitReviewMutation,
  useAcknowledgeReviewMutation,
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useCommentAnnouncementMutation,
  useReactAnnouncementMutation,
  useGetDocumentsQuery,
  useUploadDocumentMutation,
  useVerifyDocumentMutation,
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
} = apiSlice;
