import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import Attendance from '../models/Attendance.js';
import Leave from '../models/Leave.js';
import LeaveBalance from '../models/LeaveBalance.js';
import Payroll from '../models/Payroll.js';
import Job from '../models/Job.js';
import Candidate from '../models/Candidate.js';
import Announcement from '../models/Announcement.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hrms';

const hashPassword = async (pwd) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(pwd, salt);
};

const seed = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Database connected. Clearing existing data...');

    await User.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await Attendance.deleteMany({});
    await Leave.deleteMany({});
    await LeaveBalance.deleteMany({});
    await Payroll.deleteMany({});
    await Job.deleteMany({});
    await Candidate.deleteMany({});
    await Announcement.deleteMany({});

    // Drop stale indexes to avoid duplicate key errors on old fields
    try {
      await mongoose.connection.db.collection('users').dropIndexes();
    } catch (e) {}
    try {
      await mongoose.connection.db.collection('employees').dropIndexes();
    } catch (e) {}
    try {
      await mongoose.connection.db.collection('departments').dropIndexes();
    } catch (e) {}

    console.log('Cleared all collections and stale indexes.');

    // 1. Seed Departments
    console.log('Seeding departments...');
    const deptsData = [
      { name: 'Engineering', description: 'Software design and development' },
      { name: 'HR', description: 'Human Resources and Operations' },
      { name: 'Finance', description: 'Financial planning, accounting and salary' },
      { name: 'Marketing', description: 'Brand advertising and client acquisition' },
      { name: 'Operations', description: 'Day to day office operations' },
    ];
    const departments = await Department.insertMany(deptsData);
    console.log(`Seeded ${departments.length} departments.`);

    const engDept = departments.find(d => d.name === 'Engineering');
    const hrDept = departments.find(d => d.name === 'HR');
    const finDept = departments.find(d => d.name === 'Finance');
    const mktDept = departments.find(d => d.name === 'Marketing');
    const opsDept = departments.find(d => d.name === 'Operations');

    // Helper to generate employee details
    const makeEmployeeData = (empId, fName, lName, email, phone, deptId, designation, salary, joiningDateStr) => {
      const joiningDate = new Date(joiningDateStr);
      return {
        employeeId: empId,
        personalInfo: {
          firstName: fName,
          lastName: lName,
          dob: new Date('1990-05-15'),
          gender: 'Male',
          bloodGroup: 'O+',
          maritalStatus: 'Single',
          aadhaar: '123456789012',
          pan: 'ABCDE1234F',
          photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80',
        },
        contactInfo: {
          workEmail: email,
          personalEmail: fName.toLowerCase() + '@gmail.com',
          phone: phone,
          address: {
            street: '123 Main St',
            city: 'Bangalore',
            state: 'Karnataka',
            pin: '560001',
            country: 'India',
          },
        },
        emergencyContact: {
          name: 'Emergency Contact Person',
          relation: 'Parent',
          phone: '9876543210',
        },
        workInfo: {
          department: deptId,
          designation: designation,
          dateOfJoining: joiningDate,
          employmentType: 'Full-time',
          workLocation: 'Bangalore Office',
          shift: '09:00 - 18:00',
        },
        salaryInfo: {
          basic: Math.round(salary * 0.4),
          hra: Math.round(salary * 0.2),
          da: Math.round(salary * 0.1),
          conveyance: Math.round(salary * 0.05),
          medical: Math.round(salary * 0.05),
          specialAllowance: Math.round(salary * 0.15),
          otherAllowances: Math.round(salary * 0.05),
          bankName: 'HDFC Bank',
          accountNumber: '50100012345678',
          ifsc: 'HDFC0000001',
          accountHolder: `${fName} ${lName}`,
        },
        isActive: true,
      };
    };

    // Create 8 Employees: 1 Admin/SuperAdmin, 1 HRManager, 1 TeamManager (Engineering), 5 normal Employees
    console.log('Seeding employees...');
    const empSpecs = [
      makeEmployeeData('EMP001', 'Admin', 'HRMS', 'admin@hrms.com', '9900112233', hrDept._id, 'Super Administrator', 150000, '2024-01-01'),
      makeEmployeeData('EMP002', 'Sarah', 'Jenkins', 'hr@hrms.com', '9900112244', hrDept._id, 'HR Manager', 90000, '2024-02-01'),
      makeEmployeeData('EMP003', 'John', 'Doe', 'manager@hrms.com', '9900112255', engDept._id, 'Engineering Lead', 120000, '2024-03-01'),
      makeEmployeeData('EMP004', 'David', 'Miller', 'david@hrms.com', '9900112266', engDept._id, 'Senior Engineer', 85000, '2024-06-15'),
      makeEmployeeData('EMP005', 'Emily', 'Clark', 'emily@hrms.com', '9900112277', engDept._id, 'Frontend Developer', 65000, '2025-01-10'),
      makeEmployeeData('EMP006', 'Michael', 'Baker', 'michael@hrms.com', '9900112288', finDept._id, 'Finance Lead', 80000, '2024-05-01'),
      makeEmployeeData('EMP007', 'Jessica', 'Davis', 'jessica@hrms.com', '9900112299', mktDept._id, 'Marketing Executive', 50000, '2024-08-01'),
      makeEmployeeData('EMP008', 'James', 'Wilson', 'james@hrms.com', '9900112200', opsDept._id, 'Operations Associate', 45000, '2024-09-01'),
    ];

    const employees = await Employee.insertMany(empSpecs);
    console.log(`Seeded ${employees.length} employees.`);

    const adminEmp = employees[0];
    const hrEmp = employees[1];
    const managerEmp = employees[2];
    const engEmp1 = employees[3];
    const engEmp2 = employees[4];
    const finEmp = employees[5];
    const mktEmp = employees[6];
    const opsEmp = employees[7];

    // Update HODs for Departments
    console.log('Updating HOD values...');
    engDept.hod = managerEmp._id;
    await engDept.save();
    hrDept.hod = hrEmp._id;
    await hrDept.save();
    finDept.hod = finEmp._id;
    await finDept.save();

    // Update Reporting Managers
    console.log('Updating Reporting Managers...');
    engEmp1.workInfo.reportingManager = managerEmp._id;
    await engEmp1.save();
    engEmp2.workInfo.reportingManager = managerEmp._id;
    await engEmp2.save();
    managerEmp.workInfo.reportingManager = adminEmp._id;
    await managerEmp.save();
    hrEmp.workInfo.reportingManager = adminEmp._id;
    await hrEmp.save();
    finEmp.workInfo.reportingManager = adminEmp._id;
    await finEmp.save();
    mktEmp.workInfo.reportingManager = adminEmp._id;
    await mktEmp.save();
    opsEmp.workInfo.reportingManager = adminEmp._id;
    await opsEmp.save();

    // 2. Seed Users
    console.log('Seeding user credentials...');
    const hashedAdminPassword = await hashPassword('Admin@123');
    const hashedHrPassword = await hashPassword('Hr@123');
    const hashedManagerPassword = await hashPassword('Manager@123');
    const hashedEmpPassword = await hashPassword('Emp@123');

    const usersData = [
      { email: 'admin@hrms.com', password: hashedAdminPassword, role: 'SuperAdmin', employee: adminEmp._id },
      { email: 'hr@hrms.com', password: hashedHrPassword, role: 'HRManager', employee: hrEmp._id },
      { email: 'manager@hrms.com', password: hashedManagerPassword, role: 'TeamManager', employee: managerEmp._id },
      { email: 'david@hrms.com', password: hashedEmpPassword, role: 'Employee', employee: engEmp1._id },
      { email: 'emily@hrms.com', password: hashedEmpPassword, role: 'Employee', employee: engEmp2._id },
      { email: 'michael@hrms.com', password: hashedEmpPassword, role: 'Employee', employee: finEmp._id },
      { email: 'jessica@hrms.com', password: hashedEmpPassword, role: 'Employee', employee: mktEmp._id },
      { email: 'james@hrms.com', password: hashedEmpPassword, role: 'Employee', employee: opsEmp._id },
    ];

    const users = await User.insertMany(usersData);
    console.log(`Seeded ${users.length} users.`);

    // 3. Seed Leave Balances
    console.log('Seeding leave balances...');
    const balances = employees.map(emp => ({
      employee: emp._id,
      year: 2026,
      casual: { total: 10, used: 2, remaining: 8 },
      sick: { total: 10, used: 1, remaining: 9 },
      paid: { total: 15, used: 3, remaining: 12 },
      wfh: { total: 20, used: 5, remaining: 15 },
    }));
    await LeaveBalance.insertMany(balances);
    console.log('Seeded leave balances for all employees.');

    // 4. Seed Attendance (Last 30 Days)
    console.log('Seeding attendance log...');
    const attendanceLogs = [];
    const today = new Date();
    // Generate records for past 30 calendar days
    for (let i = 30; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      
      // Skip future dates if today is early in the day
      if (d > today) continue;
      
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday

      employees.forEach((emp) => {
        // Skip attendance seeding if employee joined after the date
        if (emp.workInfo.dateOfJoining > d) return;

        if (isWeekend) {
          // Weekend - mark as Holiday or Absent/WFH occasionally
          attendanceLogs.push({
            employee: emp._id,
            date: new Date(d.setHours(0,0,0,0)),
            status: 'Holiday',
          });
        } else {
          // Weekday - 90% Present, 5% WFH, 3% Leave, 2% Absent
          const rand = Math.random();
          let status = 'Present';
          let checkIn = '09:05:00';
          let checkOut = '18:02:00';
          let totalHours = 8.95;
          let isLate = false;
          let isEarlyDeparture = false;

          if (rand < 0.05) {
            status = 'WFH';
            checkIn = '09:00:00';
            checkOut = '18:00:00';
            totalHours = 9.0;
          } else if (rand < 0.08) {
            status = 'Leave';
            checkIn = undefined;
            checkOut = undefined;
            totalHours = 0;
          } else if (rand < 0.10) {
            status = 'Half-day';
            checkIn = '09:15:00';
            checkOut = '13:30:00';
            totalHours = 4.25;
            isEarlyDeparture = true;
          } else if (rand < 0.12) {
            status = 'Absent';
            checkIn = undefined;
            checkOut = undefined;
            totalHours = 0;
          } else {
            // Adjust arrival time (sometimes late)
            if (Math.random() < 0.15) {
              checkIn = '09:35:00'; // late
              isLate = true;
            }
            // Adjust departure time (sometimes early)
            if (Math.random() < 0.10) {
              checkOut = '17:45:00';
              isEarlyDeparture = true;
            }
            const [ciH, ciM] = checkIn.split(':').map(Number);
            const [coH, coM] = checkOut.split(':').map(Number);
            totalHours = (coH * 60 + coM - (ciH * 60 + ciM) - 60) / 60; // deduct 1 hour break
          }

          attendanceLogs.push({
            employee: emp._id,
            date: new Date(d.setHours(0,0,0,0)),
            checkIn,
            checkOut,
            totalHours: Math.max(0, parseFloat(totalHours.toFixed(2))),
            breakTime: status === 'Present' || status === 'WFH' ? 60 : 0,
            status,
            isLate,
            isEarlyDeparture,
          });
        }
      });
    }

    await Attendance.insertMany(attendanceLogs);
    console.log(`Seeded ${attendanceLogs.length} attendance records.`);

    // 5. Seed Leave Applications
    console.log('Seeding leave applications...');
    const leaveApplications = [
      {
        employee: engEmp1._id,
        leaveType: 'Paid',
        fromDate: new Date('2026-06-10'),
        toDate: new Date('2026-06-12'),
        totalDays: 3,
        reason: 'Family wedding out of station',
        status: 'Approved',
        approvedBy: adminEmp._id,
        approvedAt: new Date(),
        comments: 'Approved. Ensure handovers are completed.',
      },
      {
        employee: engEmp2._id,
        leaveType: 'Sick',
        fromDate: new Date('2026-06-20'),
        toDate: new Date('2026-06-20'),
        totalDays: 1,
        reason: 'Down with seasonal flu',
        status: 'Approved',
        approvedBy: managerEmp._id,
        approvedAt: new Date(),
        comments: 'Get well soon. Work from home if feeling better tomorrow.',
      },
      {
        employee: engEmp1._id,
        leaveType: 'Casual',
        fromDate: new Date('2026-07-05'),
        toDate: new Date('2026-07-06'),
        totalDays: 2,
        reason: 'Personal urgent business',
        status: 'Pending',
      },
      {
        employee: mktEmp._id,
        leaveType: 'WFH',
        fromDate: new Date('2026-06-25'),
        toDate: new Date('2026-06-26'),
        totalDays: 2,
        reason: 'Repair work at house',
        status: 'Approved',
        approvedBy: adminEmp._id,
        approvedAt: new Date(),
      },
      {
        employee: opsEmp._id,
        leaveType: 'Paid',
        fromDate: new Date('2026-05-02'),
        toDate: new Date('2026-05-05'),
        totalDays: 4,
        reason: 'Summer vacation trip',
        status: 'Approved',
        approvedBy: adminEmp._id,
        approvedAt: new Date(),
      }
    ];
    await Leave.insertMany(leaveApplications);
    console.log('Seeded leave applications.');

    // 6. Seed 3 Months of Payroll History (March, April, May 2026)
    console.log('Seeding payroll records...');
    const payrollHistory = [];
    const months = [
      { m: 3, name: 'March 2026' },
      { m: 4, name: 'April 2026' },
      { m: 5, name: 'May 2026' }
    ];

    months.forEach(({ m, name }) => {
      employees.forEach(emp => {
        // Skip payroll if they joined after this month
        const joinYear = emp.workInfo.dateOfJoining.getFullYear();
        const joinMonth = emp.workInfo.dateOfJoining.getMonth() + 1;
        if (joinYear > 2026 || (joinYear === 2026 && joinMonth > m)) return;

        const sal = emp.salaryInfo;
        const gross = sal.basic + sal.hra + sal.da + sal.conveyance + sal.medical + sal.specialAllowance + sal.otherAllowances;
        
        // standard deductions
        const pf = Math.round(sal.basic * 0.12);
        const esi = gross < 21000 ? Math.round(gross * 0.0075) : 0;
        const pt = gross > 20000 ? 200 : 0;
        const tds = Math.round(gross * 0.05); // rough estimate
        const totalDeductions = pf + esi + pt + tds;
        const netPay = gross - totalDeductions;

        payrollHistory.push({
          employee: emp._id,
          month: m,
          year: 2026,
          payPeriod: name,
          earnings: {
            basic: sal.basic,
            hra: sal.hra,
            da: sal.da,
            conveyance: sal.conveyance,
            medical: sal.medical,
            special: sal.specialAllowance,
            other: sal.otherAllowances,
          },
          deductions: {
            pf,
            esi,
            pt,
            tds,
            loan: 0,
            other: 0,
          },
          lopDays: 0,
          lopAmount: 0,
          grossEarnings: gross,
          totalDeductions,
          netPay,
          status: 'Paid',
          processedBy: adminEmp._id,
          processedAt: new Date(`2026-0${m + 1}-01`),
          payslipUrl: `/payslips/EMP_${emp.employeeId}_2026_0${m}.pdf`
        });
      });
    });

    await Payroll.insertMany(payrollHistory);
    console.log(`Seeded ${payrollHistory.length} payroll history records.`);

    // 7. Seed Job Openings (Recruitment)
    console.log('Seeding job openings...');
    const jobsData = [
      {
        title: 'Senior Full Stack Engineer',
        department: engDept._id,
        location: 'Bangalore, India (Hybrid)',
        type: 'Full-time',
        experience: '5-8 years',
        skills: ['React.js', 'Node.js', 'Express', 'MongoDB', 'Redis'],
        description: '<p>We are looking for a Senior Full Stack Developer to lead our HRMS systems. Core responsibilities include architecture, implementation and maintenance of our core microservices.</p>',
        salaryRange: { min: 1400000, max: 2000000 },
        deadline: new Date('2026-07-31'),
        status: 'Published',
        postedBy: adminEmp._id,
        applicationsCount: 2,
      },
      {
        title: 'Talent Acquisition Partner',
        department: hrDept._id,
        location: 'Mumbai, India (On-site)',
        type: 'Full-time',
        experience: '2-4 years',
        skills: ['Recruitment', 'Negotiation', 'Sourcing', 'ATS Systems'],
        description: '<p>Join our HR team and help us source excellent software and operations talents. You will handle end-to-end recruitment pipelines.</p>',
        salaryRange: { min: 600000, max: 900000 },
        deadline: new Date('2026-07-15'),
        status: 'Published',
        postedBy: adminEmp._id,
        applicationsCount: 1,
      },
      {
        title: 'UI/UX Designer Intern',
        department: engDept._id,
        location: 'Remote (India)',
        type: 'Intern',
        experience: '0-1 years',
        skills: ['Figma', 'Prototyping', 'User Research', 'Wireframing'],
        description: '<p>A 6-month internship for enthusiastic designers wanting to build enterprise dashboard applications. Strong portfolio required.</p>',
        salaryRange: { min: 25000, max: 35000 },
        deadline: new Date('2026-07-10'),
        status: 'Published',
        postedBy: adminEmp._id,
        applicationsCount: 1,
      }
    ];

    const jobs = await Job.insertMany(jobsData);
    console.log('Seeded job openings.');

    // 8. Seed Candidates
    console.log('Seeding candidates...');
    const candidatesData = [
      {
        job: jobs[0]._id,
        firstName: 'Alice',
        lastName: 'Cooper',
        email: 'alice@gmail.com',
        phone: '9888877777',
        resumeUrl: '/uploads/resumes/alice_resume.pdf',
        currentCTC: 1200000,
        expectedCTC: 1600000,
        noticePeriod: 30,
        stage: 'Technical',
        notes: [
          { text: 'Initial HR screening cleared. Coding test score was 95%', addedBy: hrEmp._id }
        ],
      },
      {
        job: jobs[0]._id,
        firstName: 'Bob',
        lastName: 'Sagar',
        email: 'bob@gmail.com',
        phone: '9888866666',
        resumeUrl: '/uploads/resumes/bob_resume.pdf',
        currentCTC: 1100000,
        expectedCTC: 1500000,
        noticePeriod: 60,
        stage: 'Applied',
      },
      {
        job: jobs[1]._id,
        firstName: 'Diana',
        lastName: 'Prince',
        email: 'diana@gmail.com',
        phone: '9888855555',
        resumeUrl: '/uploads/resumes/diana_resume.pdf',
        currentCTC: 500000,
        expectedCTC: 750000,
        noticePeriod: 0,
        stage: 'Offered',
        offer: {
          letterUrl: '/uploads/offers/diana_offer.pdf',
          status: 'Sent',
          sentAt: new Date(),
          joiningDate: new Date('2026-07-15'),
          salary: 720000,
        }
      },
      {
        job: jobs[2]._id,
        firstName: 'Charlie',
        lastName: 'Brown',
        email: 'charlie@gmail.com',
        phone: '9888844444',
        resumeUrl: '/uploads/resumes/charlie_resume.pdf',
        stage: 'Interview',
      }
    ];

    await Candidate.insertMany(candidatesData);
    console.log('Seeded candidates.');

    // 9. Seed Announcements
    console.log('Seeding announcements...');
    const announcementsData = [
      {
        title: 'Quarterly Town Hall Meeting - Q2 2026',
        content: '<p>Hello Everyone,</p><p>We are hosting our quarterly town hall to discuss Q2 highlights and goals for Q3. Please join on MS Teams. attendance is mandatory.</p>',
        category: 'Event',
        priority: 'Important',
        isPinned: true,
        targetAudience: 'All',
        postedBy: adminEmp._id,
      },
      {
        title: 'Independence Day Holiday',
        content: '<p>Dear Team,</p><p>Please note that August 15th (Independence Day) will be a paid national holiday. The offices will remain closed.</p>',
        category: 'Holiday',
        priority: 'Normal',
        isPinned: false,
        targetAudience: 'All',
        postedBy: adminEmp._id,
      },
      {
        title: 'Updated Leave Carry-Forward Policy',
        content: '<p>Hi All,</p><p>The management has updated the carry-forward policy. Now you can carry forward up to 5 days of Casual Leave to next year. Detailed policy document is uploaded in Settings.</p>',
        category: 'Policy',
        priority: 'Urgent',
        isPinned: true,
        targetAudience: 'All',
        postedBy: adminEmp._id,
      },
      {
        title: 'New Engineering Hires Welcoming',
        content: '<p>Team Engineering,</p><p>Please welcome David and Emily who joined us recently! Feel free to sync up and help them get on-boarded.</p>',
        category: 'News',
        priority: 'Normal',
        isPinned: false,
        targetAudience: 'Department',
        targetDepartments: [engDept._id],
        postedBy: adminEmp._id,
      },
      {
        title: 'Financial Year Closing Directives',
        content: '<p>To Finance Team,</p><p>Please prepare the monthly reports and salary structures for Q1 audit. Deadline is June 30th.</p>',
        category: 'Circular',
        priority: 'Important',
        isPinned: false,
        targetAudience: 'Department',
        targetDepartments: [finDept._id],
        postedBy: adminEmp._id,
      }
    ];

    await Announcement.insertMany(announcementsData);
    console.log('Seeded announcements.');

    console.log('Seed process completed successfully! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seed();
