
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testBackend() {
    try {
        console.log('--- STARTING BACKEND VERIFICATION ---');

        // 1. Login as Head
        console.log('\n[1] Testing Head Login...');
        const headLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'roshangaikwad1902@gmail.com',
            password: '123456'
        });
        
        if (headLogin.status === 200 && headLogin.data.token) {
            console.log('✅ Head Login Successful');
        } else {
            console.error('❌ Head Login Failed');
            return;
        }

        const headToken = headLogin.data.token;
        const headHeaders = { Authorization: `Bearer ${headToken}` };

        // 1.5 Login as Coordinator
        console.log('\n[1.5] Testing Coordinator Login...');
        const coordLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'roshangaikwad2006@gmail.com',
            password: '123456'
        });

        if (coordLogin.status === 200 && coordLogin.data.token) {
            console.log('✅ Coordinator Login Successful');
            
            const coordToken = coordLogin.data.token;
            const coordHeaders = { Authorization: `Bearer ${coordToken}` };

            // Fetch Coordinator Dashboard Stats
            console.log('\n[1.6] Testing Coordinator Dashboard Stats...');
            try {
                const stats = await axios.get(`${API_URL}/bookings/dashboard-stats`, { headers: coordHeaders });
                if (stats.status === 200) {
                    console.log('✅ Fetched Dashboard Stats');
                    console.log(`   - Pending Requests: ${stats.data.pendingRequests}`);
                } else {
                    console.error('❌ Fetch Dashboard Stats Failed');
                }
            } catch (e) {
                 console.error('❌ Fetch Dashboard Stats Error:', e.response ? e.response.data : e.message);
            }

        } else {
            console.error('❌ Coordinator Login Failed');
        }

        // 2. Fetch Machinery List (Head)
        console.log('\n[2] Testing Fetch Machinery (Head)...');
        const machines = await axios.get(`${API_URL}/machinery`, { headers: headHeaders });
        if (machines.status === 200) {
            console.log(`✅ Fetched ${machines.data.length} machines`);
        } else {
            console.error('❌ Fetch Machinery Failed');
        }

        // 3. Fetch Machinery Records (Head - New Feature)
        console.log('\n[3] Testing Fetch Machinery Records (Head)...');
        try {
            const records = await axios.get(`${API_URL}/machinery/records?filter=daily`, { headers: headHeaders });
            if (records.status === 200) {
                console.log(`✅ Fetched ${records.data.length} records`);
                if(records.data.length > 0) {
                    const r = records.data[0];
                    console.log(`   - [Record 1] Status: ${r.status}`);
                    console.log(`   - [Record 1] UsageDate: ${r.usageDate} (Type: ${typeof r.usageDate})`);
                    console.log(`   - [Record 1] Slot: ${r.startTime} - ${r.endTime}`);
                    console.log(`   - [Record 1] Entry Time: ${r.actualEntryTime}`);
                    console.log(`   - [Record 1] Exit Time: ${r.actualExitTime}`);
                    
                    // Specific check for Seeded "Yesterday" Data
                    if (r.actualEntryTime) {
                        console.log(`   - [Data Check] Entry Time Saved: ✅ YES`);
                    } else {
                        console.log(`   - [Data Check] Entry Time Saved: ❌ NO (might be pending/approved request)`);
                    }
                }
            } else {
                console.error('❌ Fetch Records Failed');
            }
        } catch (e) {
             console.error('❌ Fetch Records Error:', e.response ? e.response.data : e.message);
        }

        // 4. Login as Student
        console.log('\n[4] Testing Student Login...');
        const studentLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'student@test.com',
            password: 'student1'
        });

        if (studentLogin.status === 200 && studentLogin.data.token) {
             console.log('✅ Student Login Successful');
        } else {
             console.error('❌ Student Login Failed');
             return;
        }
        
        const studentToken = studentLogin.data.token;
        const studentHeaders = { Authorization: `Bearer ${studentToken}` };

        // 5. Fetch Machinery As Student
        console.log('\n[5] Testing Fetch Machinery (Student)...');
        const studentMachines = await axios.get(`${API_URL}/machinery`, { headers: studentHeaders });
        if (studentMachines.status === 200 && studentMachines.data.length > 0) {
            console.log(`✅ Fetched ${studentMachines.data.length} machines as student`);
            
            const machineId = studentMachines.data[0]._id;

            // 6. Create Request (Student)
            console.log('\n[6] Testing Create Request (Student)...');
            const newRequestPayload = {
                machineryId: machineId,
                teamMembers: [{ name: 'Test Student', branch: 'CSE', year: '4th' }],
                usageDate: new Date(new Date().setDate(new Date().getDate() + 2)), // 2 days from now
                startTime: '11:00',
                endTime: '12:00',
                purpose: 'Automated backend verification test',
                consentAgreed: true,
                groupPhotoUrl: 'https://placehold.co/100x100'
            };

            try {
                const createRes = await axios.post(`${API_URL}/machinery/requests`, newRequestPayload, { headers: studentHeaders });
                if (createRes.status === 201) {
                    console.log('✅ Created Request Successfully');
                    const createdRequestId = createRes.data._id;
                    
                    // 7. Fetch My Requests (Student)
                    console.log('\n[7] Testing Get My Requests (Student)...');
                    const myRequests = await axios.get(`${API_URL}/machinery/requests`, { headers: studentHeaders });
                    if (myRequests.status === 200) {
                        const found = myRequests.data.find(r => r._id === createdRequestId);
                        if (found) {
                            console.log(`✅ Fetched My Requests (Found created request: ${found._id})`);
                        } else {
                            console.error('❌ Created request NOT found in My Requests');
                        }
                    }

                    // 8. Approve Request (Head)
                    console.log('\n[8] Testing Approve Request (Head)...');
                    try {
                        const approveRes = await axios.patch(
                            `${API_URL}/machinery/requests/${createdRequestId}/status`, 
                            { status: 'approved' }, 
                            { headers: headHeaders }
                        );
                        
                        if (approveRes.status === 200 && approveRes.data.status === 'approved') {
                            console.log('✅ Request Approved Successfully');
                            console.log(`   - Approved By: ${approveRes.data.approvedBy}`);
                        } else {
                            console.error('❌ Request Approval Failed');
                        }
                    } catch (approveError) {
                        console.error('❌ Approve Request Error:', approveError.response ? approveError.response.data : approveError.message);
                    }

                } else {
                    console.error('❌ Create Request Failed');
                }
            } catch (postError) {
                console.error('❌ Create Request Error:', postError.response ? postError.response.data : postError.message);
            }

        } else {
             console.error('❌ Fetch Machinery (Student) Failed or No Machines Found');
        }

        console.log('\n--- VERIFICATION COMPLETE ---');

    } catch (error) {
        console.error('\n❌ CRITICAL FAILURE:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
            console.error('Response Status:', error.response.status);
        }
    }
}

testBackend();
