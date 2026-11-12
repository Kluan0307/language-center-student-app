import type {Grade,Summary} from "./Progress";
export function scoreLabel(g:Pick<Grade,'score'|'status'|'maxScore'>){return g.status==='NOT_GRADED'||g.score===null?'Chưa chấm':`${g.score} / ${g.maxScore}`;}
export function percentLabel(s:Summary){return s.coverageComplete&&s.attendancePercent!==null?`${s.attendancePercent}%`:s.eligibleCompleted===0?'Chưa có buổi đủ điều kiện':'Chưa đủ dữ liệu để tính tỷ lệ';}
