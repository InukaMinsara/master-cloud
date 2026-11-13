// scripts/native-ram-win32.rs
// Compile: rustc -O scripts/native-ram-win32.rs -o scripts/bin/master-ram-win32.exe
//
// MASTER RAM — Ultra-lightweight Native Windows Win32 Memory Optimizer & Telemetry Helper.
// Zero external crate dependencies. Uses official kernel32 / psapi / user32 / advapi32 / ntdll APIs.

use std::collections::HashSet;
use std::env;
use std::ffi::c_void;
use std::mem::{size_of, zeroed};

type Handle = *mut c_void;
type Hwnd = *mut c_void;
type Dword = u32;
type Bool = i32;

const INVALID_HANDLE_VALUE: Handle = (-1isize) as Handle;
const TH32CS_SNAPPROCESS: Dword = 0x00000002;
const PROCESS_SET_QUOTA: Dword = 0x0100;
const PROCESS_QUERY_INFORMATION: Dword = 0x0400;
const PROCESS_QUERY_LIMITED_INFORMATION: Dword = 0x1000;
const PROCESS_SET_INFORMATION: Dword = 0x0200;
const ABOVE_NORMAL_PRIORITY_CLASS: Dword = 0x00008000;
const BELOW_NORMAL_PRIORITY_CLASS: Dword = 0x00004000;
const TOKEN_ADJUST_PRIVILEGES: Dword = 0x0020;
const TOKEN_QUERY: Dword = 0x0008;
const SE_PRIVILEGE_ENABLED: Dword = 0x00000002;
const SYSTEM_MEMORY_LIST_INFORMATION: i32 = 80;
const MEMORY_EMPTY_WORKING_SETS: u32 = 2;
const MEMORY_FLUSH_MODIFIED_LIST: u32 = 3;
const MEMORY_PURGE_STANDBY_LIST: u32 = 4;
const MEM_COMMIT: Dword = 0x1000;
const MEM_RESERVE: Dword = 0x2000;
const MEM_RELEASE: Dword = 0x8000;
const PAGE_READWRITE: Dword = 0x04;
const FILE_MAP_ALL_ACCESS: Dword = 0x000F001F;

#[repr(C)]
#[derive(Copy, Clone)]
struct MemoryStatusEx {
    dw_length: Dword,
    dw_memory_load: Dword,
    ull_total_phys: u64,
    ull_avail_phys: u64,
    ull_total_page_file: u64,
    ull_avail_page_file: u64,
    ull_total_virtual: u64,
    ull_avail_virtual: u64,
    ull_avail_extended_virtual: u64,
}

#[repr(C)]
struct ProcessEntry32W {
    dw_size: Dword,
    cnt_usage: Dword,
    th32_process_id: Dword,
    th32_default_heap_id: usize,
    th32_module_id: Dword,
    cnt_threads: Dword,
    th32_parent_process_id: Dword,
    pc_pri_class_base: i32,
    dw_flags: Dword,
    sz_exe_file: [u16; 260],
}

#[repr(C)]
struct ProcessMemoryCounters {
    cb: Dword,
    page_fault_count: Dword,
    peak_working_set_size: usize,
    working_set_size: usize,
    quota_peak_paged_pool_usage: usize,
    quota_paged_pool_usage: usize,
    quota_peak_non_paged_pool_usage: usize,
    quota_non_paged_pool_usage: usize,
    pagefile_usage: usize,
    peak_pagefile_usage: usize,
}

#[repr(C)]
#[derive(Copy, Clone)]
struct Luid {
    low_part: Dword,
    high_part: i32,
}

#[repr(C)]
#[derive(Copy, Clone)]
struct LuidAndAttributes {
    luid: Luid,
    attributes: Dword,
}

#[repr(C)]
struct TokenPrivileges {
    privilege_count: Dword,
    privileges: [LuidAndAttributes; 1],
}

#[link(name = "kernel32")]
extern "system" {
    fn GlobalMemoryStatusEx(lp_buffer: *mut MemoryStatusEx) -> Bool;
    fn CreateToolhelp32Snapshot(dw_flags: Dword, th32_process_id: Dword) -> Handle;
    fn Process32FirstW(h_snapshot: Handle, lppe: *mut ProcessEntry32W) -> Bool;
    fn Process32NextW(h_snapshot: Handle, lppe: *mut ProcessEntry32W) -> Bool;
    fn OpenProcess(dw_desired_access: Dword, b_inherit_handle: Bool, dw_process_id: Dword) -> Handle;
    fn CloseHandle(h_object: Handle) -> Bool;
    fn GetCurrentProcess() -> Handle;
    fn GetCurrentProcessId() -> Dword;
    fn GetLastError() -> Dword;
    fn SetPriorityClass(h_process: Handle, dw_priority_class: Dword) -> Bool;
    fn SetProcessWorkingSetSizeEx(
        h_process: Handle,
        dw_minimum_working_set_size: usize,
        dw_maximum_working_set_size: usize,
        flags: Dword,
    ) -> Bool;
    fn VirtualAlloc(lp_address: *mut c_void, dw_size: usize, fl_allocation_type: Dword, fl_protect: Dword) -> *mut c_void;
    fn VirtualFree(lp_address: *mut c_void, dw_size: usize, dw_free_type: Dword) -> Bool;
    fn CreateFileMappingW(
        h_file: Handle,
        lp_file_mapping_attributes: *const c_void,
        fl_protect: Dword,
        dw_maximum_size_high: Dword,
        dw_maximum_size_low: Dword,
        lp_name: *const u16,
    ) -> Handle;
    fn MapViewOfFile(
        h_file_mapping_object: Handle,
        dw_desired_access: Dword,
        dw_file_offset_high: Dword,
        dw_file_offset_low: Dword,
        dw_number_of_bytes_to_map: usize,
    ) -> *mut c_void;
    fn UnmapViewOfFile(lp_base_address: *const c_void) -> Bool;
}

#[link(name = "psapi")]
extern "system" {
    fn GetProcessMemoryInfo(
        process: Handle,
        ppsmem_counters: *mut ProcessMemoryCounters,
        cb: Dword,
    ) -> Bool;
    fn EmptyWorkingSet(h_process: Handle) -> Bool;
}

#[link(name = "user32")]
extern "system" {
    fn GetForegroundWindow() -> Hwnd;
    fn GetWindowThreadProcessId(h_wnd: Hwnd, lpdw_process_id: *mut Dword) -> Dword;
}

#[link(name = "advapi32")]
extern "system" {
    fn OpenProcessToken(
        process_handle: Handle,
        desired_access: Dword,
        token_handle: *mut Handle,
    ) -> Bool;
    fn LookupPrivilegeValueW(
        lp_system_name: *const u16,
        lp_name: *const u16,
        lp_luid: *mut Luid,
    ) -> Bool;
    fn AdjustTokenPrivileges(
        token_handle: Handle,
        disable_all_privileges: Bool,
        new_state: *const TokenPrivileges,
        buffer_length: Dword,
        previous_state: *mut c_void,
        return_length: *mut Dword,
    ) -> Bool;
}

#[link(name = "ntdll")]
extern "system" {
    fn NtSetSystemInformation(
        system_information_class: i32,
        system_information: *mut c_void,
        system_information_length: Dword,
    ) -> i32;
}

struct ProcInfo {
    pid: Dword,
    name: String,
    working_set_bytes: u64,
    private_bytes: u64,
}

fn get_memory_status() -> Option<MemoryStatusEx> {
    unsafe {
        let mut status: MemoryStatusEx = zeroed();
        status.dw_length = size_of::<MemoryStatusEx>() as Dword;
        if GlobalMemoryStatusEx(&mut status) != 0 {
            Some(status)
        } else {
            None
        }
    }
}

fn get_foreground_pid() -> Dword {
    unsafe {
        let hwnd = GetForegroundWindow();
        if hwnd.is_null() {
            return 0;
        }
        let mut pid: Dword = 0;
        GetWindowThreadProcessId(hwnd, &mut pid);
        pid
    }
}

fn utf16_to_string(buf: &[u16]) -> String {
    let len = buf.iter().position(|&c| c == 0).unwrap_or(buf.len());
    String::from_utf16_lossy(&buf[..len])
}

fn json_escape(s: &str) -> String {
    let mut out = String::with_capacity(s.len() + 4);
    for ch in s.chars() {
        match ch {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if (c as u32) < 0x20 => {}
            c => out.push(c),
        }
    }
    out
}

fn list_processes() -> Vec<ProcInfo> {
    let mut results = Vec::new();
    unsafe {
        let snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
        if snap == INVALID_HANDLE_VALUE || snap.is_null() {
            return results;
        }
        let mut entry: ProcessEntry32W = zeroed();
        entry.dw_size = size_of::<ProcessEntry32W>() as Dword;

        if Process32FirstW(snap, &mut entry) != 0 {
            loop {
                let pid = entry.th32_process_id;
                if pid > 4 {
                    let h_proc = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
                    if !h_proc.is_null() {
                        let mut pmc: ProcessMemoryCounters = zeroed();
                        pmc.cb = size_of::<ProcessMemoryCounters>() as Dword;
                        if GetProcessMemoryInfo(h_proc, &mut pmc, pmc.cb) != 0 {
                            results.push(ProcInfo {
                                pid,
                                name: utf16_to_string(&entry.sz_exe_file),
                                working_set_bytes: pmc.working_set_size as u64,
                                private_bytes: pmc.pagefile_usage as u64,
                            });
                        }
                        CloseHandle(h_proc);
                    }
                }
                if Process32NextW(snap, &mut entry) == 0 {
                    break;
                }
            }
        }
        CloseHandle(snap);
    }
    results.sort_by(|a, b| b.working_set_bytes.cmp(&a.working_set_bytes));
    results
}

fn is_hard_protected_process(name_lower: &str) -> bool {
    matches!(
        name_lower,
        "system"
            | "registry"
            | "secure system"
            | "smss.exe"
            | "csrss.exe"
            | "wininit.exe"
            | "services.exe"
            | "lsass.exe"
            | "fontdrvhost.exe"
            | "dwm.exe"
            | "memory compression"
            | "winlogon.exe"
            | "audiodg.exe"
            | "vboxheadless.exe"
            | "vmcompute.exe"
            | "vmmem"
            | "vmmemwsl"
            | "master-ram-win32.exe"
    )
}

fn is_soft_system_process(name_lower: &str) -> bool {
    matches!(name_lower, "svchost.exe" | "sihost.exe" | "explorer.exe")
}

fn enable_privilege(priv_name_str: &str) -> bool {
    unsafe {
        let mut token: Handle = std::ptr::null_mut();
        if OpenProcessToken(GetCurrentProcess(), TOKEN_ADJUST_PRIVILEGES | TOKEN_QUERY, &mut token) == 0 {
            return false;
        }
        let mut priv_name: Vec<u16> = priv_name_str.encode_utf16().collect();
        priv_name.push(0);
        let mut luid: Luid = zeroed();
        if LookupPrivilegeValueW(std::ptr::null(), priv_name.as_ptr(), &mut luid) == 0 {
            CloseHandle(token);
            return false;
        }
        let tp = TokenPrivileges {
            privilege_count: 1,
            privileges: [LuidAndAttributes {
                luid,
                attributes: SE_PRIVILEGE_ENABLED,
            }],
        };
        let ok = AdjustTokenPrivileges(
            token,
            0,
            &tp,
            size_of::<TokenPrivileges>() as Dword,
            std::ptr::null_mut(),
            std::ptr::null_mut(),
        );
        let last_err = GetLastError();
        CloseHandle(token);
        ok != 0 && last_err == 0
    }
}

fn try_purge_standby_list() -> (bool, &'static str) {
    let has_prof = enable_privilege("SeProfileSingleProcessPrivilege");
    let _ = enable_privilege("SeIncreaseQuotaPrivilege");
    if !has_prof {
        // Still try once in case token inherited privilege, otherwise report cleanly
    }

    unsafe {
        let mut empty_ws_cmd: u32 = MEMORY_EMPTY_WORKING_SETS;
        let ws_status = NtSetSystemInformation(
            SYSTEM_MEMORY_LIST_INFORMATION,
            (&mut empty_ws_cmd as *mut u32) as *mut c_void,
            size_of::<u32>() as Dword,
        );

        let mut flush_cmd: u32 = MEMORY_FLUSH_MODIFIED_LIST;
        let flush_status = NtSetSystemInformation(
            SYSTEM_MEMORY_LIST_INFORMATION,
            (&mut flush_cmd as *mut u32) as *mut c_void,
            size_of::<u32>() as Dword,
        );

        let mut cmd: u32 = MEMORY_PURGE_STANDBY_LIST;
        let status = NtSetSystemInformation(
            SYSTEM_MEMORY_LIST_INFORMATION,
            (&mut cmd as *mut u32) as *mut c_void,
            size_of::<u32>() as Dword,
        );

        if status == 0 && flush_status == 0 && ws_status == 0 {
            (true, "System working sets emptied + Modified & Standby lists purged")
        } else if status == 0 {
            (true, "Modified & Standby lists purged")
        } else if status as u32 == 0xC0000061 {
            (false, "Requires Administrator elevation for Modified/Standby purge")
        } else {
            (false, "NtSetSystemInformation returned non-zero status")
        }
    }
}

fn format_memory_json(status: &MemoryStatusEx) -> String {
    format!(
        "{{\"memoryLoadPercent\":{},\"totalPhysicalBytes\":{},\"availPhysicalBytes\":{},\"usedPhysicalBytes\":{},\"totalCommitBytes\":{},\"availCommitBytes\":{},\"usedCommitBytes\":{},\"totalVirtualBytes\":{},\"availVirtualBytes\":{}}}",
        status.dw_memory_load,
        status.ull_total_phys,
        status.ull_avail_phys,
        status.ull_total_phys.saturating_sub(status.ull_avail_phys),
        status.ull_total_page_file,
        status.ull_avail_page_file,
        status.ull_total_page_file.saturating_sub(status.ull_avail_page_file),
        status.ull_total_virtual,
        status.ull_avail_virtual
    )
}

fn print_memory_json(status: &MemoryStatusEx) {
    print!("{}", format_memory_json(status));
}

fn cmd_status() {
    let mem = match get_memory_status() {
        Some(m) => m,
        None => {
            println!("{{\"ok\":false,\"error\":\"GlobalMemoryStatusEx failed\"}}");
            return;
        }
    };
    let fg_pid = get_foreground_pid();
    let procs = list_processes();
    let top_count = procs.len().min(12);

    print!("{{\"ok\":true,\"foregroundPid\":{},\"processCount\":{},\"memory\":", fg_pid, procs.len());
    print_memory_json(&mem);
    print!(",\"topProcesses\":[");
    for (i, p) in procs.iter().take(top_count).enumerate() {
        if i > 0 {
            print!(",");
        }
        print!(
            "{{\"pid\":{},\"name\":\"{}\",\"workingSetBytes\":{},\"privateBytes\":{},\"isForeground\":{}}}",
            p.pid,
            json_escape(&p.name),
            p.working_set_bytes,
            p.private_bytes,
            p.pid == fg_pid
        );
    }
    println!("]}}");
}

fn cmd_optimize(args: &[String], default_target_pct: u32) {
    let aggressive = args.iter().any(|a| a == "--aggressive" || a == "--standby");
    let demote_bg = args.iter().any(|a| a == "--demote-bg");
    let mut target_pct: u32 = default_target_pct;
    let mut protect_pids: HashSet<Dword> = HashSet::new();
    let self_pid = unsafe { GetCurrentProcessId() };
    let fg_pid = get_foreground_pid();
    protect_pids.insert(self_pid);
    if fg_pid > 0 {
        protect_pids.insert(fg_pid);
    }

    let mut out_path: Option<String> = None;

    for arg in args {
        if let Some(val) = arg.strip_prefix("--protect-pid=") {
            if let Ok(pid) = val.parse::<Dword>() {
                protect_pids.insert(pid);
            }
        } else if let Some(val) = arg.strip_prefix("--target=") {
            if let Ok(pct) = val.parse::<u32>() {
                target_pct = pct.clamp(15, 95);
            }
        } else if let Some(val) = arg.strip_prefix("--out=") {
            if !val.is_empty() {
                out_path = Some(val.to_string());
            }
        }
    }

    let min_ws_bytes: u64 = if target_pct <= 40 || aggressive {
        4 * 1024 * 1024
    } else {
        12 * 1024 * 1024
    };

    let is_admin = enable_privilege("SeDebugPrivilege");
    let _ = enable_privilege("SeIncreaseQuotaPrivilege");

    let before = match get_memory_status() {
        Some(m) => m,
        None => {
            println!("{{\"ok\":false,\"error\":\"GlobalMemoryStatusEx failed\"}}");
            return;
        }
    };

    let procs = list_processes();
    let mut trimmed_count: u32 = 0;
    let mut demoted_count: u32 = 0;
    let mut skipped_count: u32 = 0;
    let mut estimated_trimmed_ws_bytes: u64 = 0;

    // Only trim background processes if current load exceeds target_pct
    if before.dw_memory_load > target_pct {
        for p in &procs {
            let lower = p.name.to_lowercase();
            let soft_sys = is_soft_system_process(&lower);
            if protect_pids.contains(&p.pid)
                || is_hard_protected_process(&lower)
                || (soft_sys && target_pct > 40 && !aggressive)
                || p.working_set_bytes < min_ws_bytes
            {
                skipped_count += 1;
                continue;
            }

            unsafe {
                let access = if demote_bg && !soft_sys {
                    PROCESS_SET_QUOTA | PROCESS_QUERY_INFORMATION | PROCESS_SET_INFORMATION
                } else {
                    PROCESS_SET_QUOTA | PROCESS_QUERY_INFORMATION
                };
                let h_proc = OpenProcess(access, 0, p.pid);
                if !h_proc.is_null() {
                    if EmptyWorkingSet(h_proc) != 0 {
                        trimmed_count += 1;
                        if !soft_sys && target_pct <= 45 && p.working_set_bytes >= 24 * 1024 * 1024 {
                            let _ = SetProcessWorkingSetSizeEx(h_proc, 2 * 1024 * 1024, 24 * 1024 * 1024, 0);
                        }
                        let mut pmc_after: ProcessMemoryCounters = zeroed();
                        pmc_after.cb = size_of::<ProcessMemoryCounters>() as Dword;
                        if GetProcessMemoryInfo(h_proc, &mut pmc_after, pmc_after.cb) != 0 {
                            let after_ws = pmc_after.working_set_size as u64;
                            estimated_trimmed_ws_bytes += p.working_set_bytes.saturating_sub(after_ws);
                        }
                    }
                    if demote_bg && !soft_sys && p.working_set_bytes >= 48 * 1024 * 1024 {
                        if SetPriorityClass(h_proc, BELOW_NORMAL_PRIORITY_CLASS) != 0 {
                            demoted_count += 1;
                        }
                    }
                    CloseHandle(h_proc);
                } else {
                    skipped_count += 1;
                }
            }

            // Early stop once physical memory load reaches target_pct
            if trimmed_count % 8 == 0 {
                if let Some(mid) = get_memory_status() {
                    if mid.dw_memory_load <= target_pct {
                        break;
                    }
                }
            }
        }
    }

    // Prioritize/restore foreground window process safely if it is a normal user app
    let mut foreground_boosted = false;
    let fg_is_protected = procs
        .iter()
        .find(|p| p.pid == fg_pid)
        .map(|p| is_hard_protected_process(&p.name.to_lowercase()))
        .unwrap_or(true);
    if fg_pid > 4 && !fg_is_protected {
        unsafe {
            let h_fg = OpenProcess(PROCESS_SET_INFORMATION | PROCESS_SET_QUOTA, 0, fg_pid);
            if !h_fg.is_null() {
                if SetPriorityClass(h_fg, ABOVE_NORMAL_PRIORITY_CLASS) != 0 {
                    foreground_boosted = true;
                }
                let _ = SetProcessWorkingSetSizeEx(h_fg, usize::MAX, usize::MAX, 0);
                CloseHandle(h_fg);
            }
        }
    }

    let mid_after_trim = get_memory_status().unwrap_or(before);
    let (standby_purged, standby_note) = if aggressive && mid_after_trim.dw_memory_load > target_pct {
        try_purge_standby_list()
    } else if aggressive {
        (false, "Target already reached before standby purge")
    } else {
        (false, "Standby purge not requested (use --aggressive)")
    };

    let after = get_memory_status().unwrap_or(before);
    let physical_reclaimed_bytes = after.ull_avail_phys.saturating_sub(before.ull_avail_phys);
    let target_reached = after.dw_memory_load <= target_pct;

    let json_out = format!(
        "{{\"ok\":true,\"isAdmin\":{},\"targetPct\":{},\"targetReached\":{},\"memoryLoadBefore\":{},\"memoryLoadAfter\":{},\"foregroundPid\":{},\"foregroundBoosted\":{},\"trimmedProcesses\":{},\"demotedProcesses\":{},\"skippedProcesses\":{},\"workingSetTrimmedBytes\":{},\"physicalReclaimedBytes\":{},\"standbyPurged\":{},\"standbyNote\":\"{}\",\"before\":{},\"after\":{}}}",
        is_admin,
        target_pct,
        target_reached,
        before.dw_memory_load,
        after.dw_memory_load,
        fg_pid,
        foreground_boosted,
        trimmed_count,
        demoted_count,
        skipped_count,
        estimated_trimmed_ws_bytes,
        physical_reclaimed_bytes,
        standby_purged,
        json_escape(standby_note),
        format_memory_json(&before),
        format_memory_json(&after)
    );
    if let Some(ref p) = out_path {
        let _ = std::fs::write(p, &json_out);
    }
    println!("{}", json_out);
}

fn cmd_bench_ddr(args: &[String]) {
    let mut mb: usize = 64;
    for a in args {
        if let Some(v) = a.strip_prefix("--mb=") {
            if let Ok(parsed) = v.parse::<usize>() {
                mb = parsed.clamp(8, 512);
            }
        }
    }

    let total_bytes = mb * 1024 * 1024;
    let threads = std::thread::available_parallelism().map(|n| n.get()).unwrap_or(4).min(32);

    unsafe {
        let src_ptr = VirtualAlloc(std::ptr::null_mut(), total_bytes, MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE) as *mut u8;
        let dst_ptr = VirtualAlloc(std::ptr::null_mut(), total_bytes, MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE) as *mut u8;

        if src_ptr.is_null() || dst_ptr.is_null() {
            if !src_ptr.is_null() { VirtualFree(src_ptr as *mut c_void, 0, MEM_RELEASE); }
            if !dst_ptr.is_null() { VirtualFree(dst_ptr as *mut c_void, 0, MEM_RELEASE); }
            println!("{{\"ok\":false,\"error\":\"VirtualAlloc failed\"}}");
            return;
        }

        // Pre-fault pages so OS demand-zeroing doesn't skew pure DDR bandwidth
        std::ptr::write_bytes(src_ptr, 0x5A, total_bytes);
        std::ptr::write_bytes(dst_ptr, 0x00, total_bytes);

        let src_addr = src_ptr as usize;
        let dst_addr = dst_ptr as usize;
        let chunk = (total_bytes / threads) & !63usize;
        let passes: usize = 4;
        let barrier = std::sync::Barrier::new(threads + 1);

        // 1. Multi-Core Native DDR Copy/Write Bandwidth (warm threads via Barrier)
        let mut copy_sec = 1e-7;
        let mut read_sec = 1e-7;

        std::thread::scope(|s| {
            for t in 0..threads {
                let offset = t * chunk;
                let len = if t + 1 == threads { total_bytes - offset } else { chunk };
                let bar = &barrier;
                s.spawn(move || {
                    let sp = (src_addr + offset) as *const u8;
                    let dp = (dst_addr + offset) as *mut u8;
                    // Wait for all threads to be spawned & warm
                    bar.wait();
                    for _ in 0..passes {
                        std::ptr::copy_nonoverlapping(sp, dp, len);
                    }
                    bar.wait();

                    // Wait to start read benchmark
                    bar.wait();
                    let words = std::slice::from_raw_parts(dp as *const u64, len / 8);
                    let mut final_acc: u64 = 0;
                    for _ in 0..passes {
                        let mut acc0: u64 = 0;
                        let mut acc1: u64 = 0;
                        let mut acc2: u64 = 0;
                        let mut acc3: u64 = 0;
                        for lane in words.chunks_exact(4) {
                            acc0 = acc0.wrapping_add(lane[0]);
                            acc1 = acc1.wrapping_add(lane[1]);
                            acc2 = acc2.wrapping_add(lane[2]);
                            acc3 = acc3.wrapping_add(lane[3]);
                        }
                        final_acc ^= acc0 ^ acc1 ^ acc2 ^ acc3;
                    }
                    std::hint::black_box(final_acc);
                    bar.wait();
                });
            }

            barrier.wait(); // Start Copy timer with all threads warm
            let t_copy = std::time::Instant::now();
            barrier.wait(); // All threads finished Copy
            copy_sec = t_copy.elapsed().as_secs_f64().max(1e-7);

            barrier.wait(); // Start Read timer with all threads warm
            let t_read = std::time::Instant::now();
            barrier.wait(); // All threads finished Read
            read_sec = t_read.elapsed().as_secs_f64().max(1e-7);
        });

        let total_transferred = total_bytes * passes;
        let gb = (total_transferred as f64) / (1024.0 * 1024.0 * 1024.0);
        let ddr_copy_gbps = gb / copy_sec;
        let ddr_read_gbps = gb / read_sec;
        let page_latency_ns = (read_sec * 1e9) / ((total_transferred / 4096) as f64);

        VirtualFree(src_ptr as *mut c_void, 0, MEM_RELEASE);
        VirtualFree(dst_ptr as *mut c_void, 0, MEM_RELEASE);

        println!(
            "{{\"ok\":true,\"threads\":{},\"testedMB\":{},\"ddrCopyGBps\":{:.2},\"ddrReadGBps\":{:.2},\"ddrCopyMBps\":{:.1},\"ddrReadMBps\":{:.1},\"pageLatencyNs\":{:.1}}}",
            threads,
            mb,
            ddr_copy_gbps,
            ddr_read_gbps,
            ddr_copy_gbps * 1024.0,
            ddr_read_gbps * 1024.0,
            page_latency_ns
        );
    }
}

fn cmd_verify_shm() {
    let name: Vec<u16> = "Local\\MasterRamSharedSlab_Verify\0".encode_utf16().collect();
    let size: usize = 4 * 1024 * 1024;
    unsafe {
        let h_map = CreateFileMappingW(
            INVALID_HANDLE_VALUE,
            std::ptr::null(),
            PAGE_READWRITE,
            0,
            size as Dword,
            name.as_ptr(),
        );
        if h_map.is_null() {
            println!("{{\"ok\":false,\"error\":\"CreateFileMappingW failed\"}}");
            return;
        }
        let view = MapViewOfFile(h_map, FILE_MAP_ALL_ACCESS, 0, 0, size);
        if view.is_null() {
            CloseHandle(h_map);
            println!("{{\"ok\":false,\"error\":\"MapViewOfFile failed\"}}");
            return;
        }
        std::ptr::write_bytes(view as *mut u8, 0xA5, 4096);
        let check = *(view as *const u8);
        UnmapViewOfFile(view);
        CloseHandle(h_map);
        println!(
            "{{\"ok\":{},\"section\":\"Local\\\\MasterRamSharedSlab_Verify\",\"mappedBytes\":{}}}",
            check == 0xA5,
            size
        );
    }
}

fn main() {
    let args: Vec<String> = env::args().collect();
    let cmd = args.get(1).map(|s| s.as_str()).unwrap_or("status");

    match cmd {
        "status" => cmd_status(),
        "optimize" => cmd_optimize(&args[2..], 0),
        "balance" => cmd_optimize(&args[2..], 30),
        "bench-ddr" => cmd_bench_ddr(&args[2..]),
        "verify-shm" => cmd_verify_shm(),
        _ => {
            println!("{{\"ok\":false,\"error\":\"Unknown command. Use: status | optimize | balance [--target=30] | bench-ddr | verify-shm\"}}");
        }
    }
}
