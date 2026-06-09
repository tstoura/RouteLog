import * as fs from 'fs'
import * as path from 'path'
import * as ExcelJS from 'exceljs'
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import {
  HIKING_FIELD_EXCEL_LABELS,
  HIKING_DIFFICULTY_EXCEL_LABELS,
} from '../scoring/constants/hiking.constants'
import {
  CLIMBING_SEASON_EXCEL_LABELS,
  CLIMBING_REPETITION_EXCEL_LABELS,
} from '../scoring/constants/climbing.constants'
import {
  EXPEDITION_SEASON_EXCEL_LABELS,
  EXPEDITION_DIFFICULTY_EXCEL_LABELS,
  EXPEDITION_ORGANIZATION_EXCEL_LABELS,
} from '../scoring/constants/expedition.constants'
import type { ExportClubDto } from './dto/export-club.dto'

// ── Template geometry constants ────────────────────────────────────────────────

/** First row that contains actual activity data (row 1 = title, row 2 = header). */
const DATA_START_ROW = 3

/**
 * Last pre-formatted data row in the hiking and climbing template sheets.
 * Rows beyond this boundary receive copied styles from this row so that
 * the extra rows look consistent with the rest of the sheet.
 */
const HIKING_CLIMBING_LAST_TEMPLATE_ROW = 53

/**
 * Last pre-formatted data row in the expedition template sheet.
 * Same style-copy rule applies for extra rows.
 */
const EXPEDITION_LAST_TEMPLATE_ROW = 33

/** Column index of the ΒΑΘΜΟΙ (points) cell in the hiking sheet (col L = 12). */
const HIKING_POINTS_COL = 12

/** Column index of the ΒΑΘΜΟΙ (points) cell in the climbing sheet (col N = 14). */
const CLIMBING_POINTS_COL = 14

/** Column index of the ΒΑΘΜΟΙ (points) cell in the expedition sheet (col N = 14). */
const EXPEDITION_POINTS_COL = 14

// ── Sentinel value used in the EOOA template for "no selection" ───────────────
const EPILOGI = 'Επιλογή'

// ── Path to the EOOA template file ────────────────────────────────────────────
// Primary:  server/templates/ — bundled inside the Docker image (production).
// Fallback: repo-root docs/export/ — used in local development.
// Override: set EXPORT_TEMPLATE_PATH env variable to use a custom path.
function resolveTemplatePath(): string {
  const envOverride = process.env['EXPORT_TEMPLATE_PATH']
  if (envOverride) return envOverride

  // In the production Docker image, process.cwd() = /app (WORKDIR).
  // The template is copied to /app/templates/ by the Dockerfile.
  const bundled = path.join(process.cwd(), 'templates', 'eooa-official-template.xlsx')
  if (fs.existsSync(bundled)) return bundled

  // Local development fallback: the file lives in the repo root docs/ folder.
  return path.join(process.cwd(), '..', 'docs', 'export', 'eooa-official-template.xlsx')
}

// ── Template buffer cache ──────────────────────────────────────────────────────
// The template file is read from disk once per process lifetime and reused on
// every export request.  ExcelJS still re-parses the XML each time (required
// for a fresh mutable workbook), but the disk I/O is eliminated after the first
// call — meaningful on a slow-disk container like Render free-tier.
let _templateBuffer: Buffer | undefined

async function loadTemplateBuffer(): Promise<Buffer> {
  if (!_templateBuffer) {
    _templateBuffer = await fs.promises.readFile(resolveTemplatePath())
  }
  return _templateBuffer
}

// ── Prisma include shape for activity queries ──────────────────────────────────

const ACTIVITY_WITH_DETAILS = {
  hikingDetail: true,
  climbingDetail: true,
  expeditionDetail: true,
  user: { select: { firstName: true, lastName: true } },
} as const

type ActivityWithDetails = Prisma.ActivityGetPayload<{
  include: typeof ACTIVITY_WITH_DETAILS
}>

// ── Helper: format a JS Date as DD/MM/YYYY string ─────────────────────────────

function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

// ── Helper: clear a row's data cells (col 1 through endCol inclusive) ─────────

function clearDataRow(sheet: ExcelJS.Worksheet, rowNum: number, endCol: number): void {
  const row = sheet.getRow(rowNum)
  for (let c = 1; c <= endCol; c++) {
    row.getCell(c).value = null
  }
  row.commit()
}

/**
 * Copies cell styles (number format, font, fill, alignment, border) from a
 * source row to a destination row.  Called for rows appended beyond the
 * template's pre-formatted range so that extra rows look consistent.
 */
function copyRowStyle(
  sheet: ExcelJS.Worksheet,
  srcRowNum: number,
  destRow: ExcelJS.Row,
): void {
  const srcRow = sheet.getRow(srcRowNum)
  if (srcRow.height) destRow.height = srcRow.height

  srcRow.eachCell({ includeEmpty: true }, (srcCell, colNum) => {
    const destCell = destRow.getCell(colNum)
    // Shallow-copy the style object to avoid aliasing.
    destCell.style = JSON.parse(JSON.stringify(srcCell.style)) as ExcelJS.Style
  })
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Build and return an Excel buffer for official club activities.
   *
   * @param clubId      Club to export (from route param — not inferred from membership).
   * @param dto         Request body. dto.requesterUserId is present for backward compat
   *                    but is IGNORED. callerUserId is the only trusted identity.
   * @param callerUserId JWT-verified user id from req.user.sub.
   *
   * Authorization:
   *   - super_admin → always allowed.
   *   - club_admin of the requested club → allowed.
   *   - anyone else (member, no membership, different club admin) → 403 Forbidden.
   *   - JWT user not found in DB (deleted after token issued) → 404 Not Found.
   *
   * All matching official activities are included regardless of count.
   * When the number of activities exceeds the template's pre-formatted rows,
   * additional rows are appended with styles copied from the last
   * pre-formatted row, keeping the sheet visually consistent.
   */
  async exportClub(clubId: string, dto: ExportClubDto, callerUserId: string): Promise<Buffer> {
    // Run all three independent operations in parallel to eliminate sequential
    // network round-trips to Supabase.  assertRequesterIsAuthorized throws
    // ForbiddenException/NotFoundException if the caller is not allowed, which
    // causes Promise.all to reject before we proceed.  The activities query runs
    // concurrently but its result is only used if auth passes.
    const [club, , activities] = await Promise.all([
      this.prisma.club.findUnique({ where: { id: clubId } }),
      this.assertRequesterIsAuthorized(callerUserId, clubId),
      this.queryOfficialActivities(clubId, dto.selectedUserIds, dto.year),
    ])

    if (!club) throw new NotFoundException(`Club ${clubId} not found`)

    // Separate by category and build the Excel file.
    const hiking = activities.filter((a) => a.category === 'hiking')
    const climbing = activities.filter((a) => a.category === 'climbing')
    const expedition = activities.filter((a) => a.category === 'expedition')

    return this.buildExcel(hiking, climbing, expedition)
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Verifies that callerUserId (from JWT) is authorized to export data for clubId.
   *
   * Allowed if:
   *   A. systemRole = "super_admin"  (can export any club's data)
   *   B. club_admin of the requested club  (scoped to their own club)
   *
   * Not allowed:
   *   - regular "member" of the club
   *   - member of a different club
   *   - user with no memberships
   *
   * @throws NotFoundException (404) if the JWT user no longer exists in the DB.
   * @throws ForbiddenException (403) if the user exists but lacks the required role.
   *
   * Note: 404 vs 401: We use 404 (not 401) for a JWT-verified user not found in DB
   * because the JWT itself was valid — the user was simply deleted after token issuance.
   * A true auth failure (bad/missing token) is handled upstream by JwtAuthGuard (401).
   */
  private async assertRequesterIsAuthorized(
    callerUserId: string,
    clubId: string,
  ): Promise<void> {
    // Fetch the user with only the membership for this club (if any).
    const user = await this.prisma.user.findUnique({
      where: { id: callerUserId },
      include: { memberships: { where: { clubId } } },
    })

    // Safety net for tokens referencing deleted users.
    if (!user) throw new NotFoundException(`User ${callerUserId} not found`)

    const isSuperAdmin = user.systemRole === 'super_admin'
    const isClubAdmin =
      user.memberships.length > 0 && user.memberships[0]!.role === 'club_admin'

    if (!isSuperAdmin && !isClubAdmin) {
      throw new ForbiddenException(
        'Only a club_admin of this club or a super_admin may export club data.',
      )
    }
  }

  /**
   * Fetches official activities for the given club and user set.
   * selectedUserIds are used only as a filter — never persisted.
   */
  private async queryOfficialActivities(
    clubId: string,
    selectedUserIds: string[],
    year?: number,
  ): Promise<ActivityWithDetails[]> {
    const where: Prisma.ActivityWhereInput = {
      clubId,
      isOfficial: true,
      userId: { in: selectedUserIds },
      ...(year
        ? {
            date: {
              gte: new Date(`${year}-01-01`),
              lte: new Date(`${year}-12-31`),
            },
          }
        : {}),
    }

    return this.prisma.activity.findMany({
      where,
      include: ACTIVITY_WITH_DETAILS,
      orderBy: { date: 'asc' },
    })
  }

  /**
   * Loads the EOOA template, fills in the three category sheets,
   * and returns the resulting workbook as a Buffer.
   */
  private async buildExcel(
    hikingActivities: ActivityWithDetails[],
    climbingActivities: ActivityWithDetails[],
    expeditionActivities: ActivityWithDetails[],
  ): Promise<Buffer> {
    const wb = new ExcelJS.Workbook()
    // Use the cached buffer instead of re-reading from disk each time.
    // ExcelJS's type signature expects ArrayBuffer but accepts Buffer at runtime.
    await wb.xlsx.load(await loadTemplateBuffer() as unknown as ArrayBuffer)

    this.fillHikingSheet(wb, hikingActivities)
    this.fillClimbingSheet(wb, climbingActivities)
    this.fillExpeditionSheet(wb, expeditionActivities)

    const arrayBuffer = await wb.xlsx.writeBuffer()
    return Buffer.from(arrayBuffer as ArrayBuffer)
  }

  // ── Sheet builders ──────────────────────────────────────────────────────────

  /**
   * Sheet "1.ΟΡΕΙΒΑΣΙΑ" — Hiking / Ski Mountaineering
   *
   * Column layout (1-based):
   *   A(1)  Α/Α          row number
   *   B(2)  ΗΜ/ΝΙΑ       date
   *   C(3)  ΒΟΥΝΟ        mountain
   *   D(4)  ΑΦΕΤΗΡΙΑ     startPoint
   *   E(5)  ΚΟΡΥΦΗ       endPoint
   *   F(6)  ΜΕΓ. ΥΨΟΜ.  maxAltitude
   *   G(7)  Σ.Υ.Α.       totalElevationGain
   *   H(8)  ΜΗΚΟΣ        distanceLength
   *   I(9)  ΠΕΔΙΟ        fieldType  → Greek label
   *   J(10) ΒΑΘ.ΔΥΣΚ.   difficultyGrade → Greek label
   *   K(11) ΑΤΟΜΑ        participantsNum
   *   L(12) ΒΑΘΜΟΙ       pre-calculated points (overrides template formula)
   */
  private fillHikingSheet(wb: ExcelJS.Workbook, activities: ActivityWithDetails[]): void {
    const sheet = wb.getWorksheet('1.ΟΡΕΙΒΑΣΙΑ')
    if (!sheet) return

    activities.forEach((act, i) => {
      const rowNum = DATA_START_ROW + i
      const d = act.hikingDetail!
      const row = sheet.getRow(rowNum)

      // Rows beyond the pre-formatted range inherit styles from the last
      // template row so that extra rows look consistent.
      if (rowNum > HIKING_CLIMBING_LAST_TEMPLATE_ROW) {
        copyRowStyle(sheet, HIKING_CLIMBING_LAST_TEMPLATE_ROW, row)
      }

      row.getCell(1).value = i + 1
      row.getCell(2).value = formatDate(act.date)
      row.getCell(3).value = d.mountain
      row.getCell(4).value = d.startPoint
      row.getCell(5).value = d.endPoint
      row.getCell(6).value = d.maxAltitude
      row.getCell(7).value = d.totalElevationGain
      row.getCell(8).value = Number(d.distanceLength)
      row.getCell(9).value =
        HIKING_FIELD_EXCEL_LABELS[d.fieldType as keyof typeof HIKING_FIELD_EXCEL_LABELS] ??
        d.fieldType
      row.getCell(10).value =
        HIKING_DIFFICULTY_EXCEL_LABELS[
          d.difficultyGrade as keyof typeof HIKING_DIFFICULTY_EXCEL_LABELS
        ] ?? d.difficultyGrade
      row.getCell(11).value = d.participantsNum
      row.getCell(HIKING_POINTS_COL).value =
        act.points !== null ? Number(act.points) : null

      row.commit()
    })

    // Clear unused pre-formatted rows (stop before the ΣΥΝΟΛΟ row at row 53).
    for (
      let r = DATA_START_ROW + activities.length;
      r < HIKING_CLIMBING_LAST_TEMPLATE_ROW;
      r++
    ) {
      clearDataRow(sheet, r, HIKING_POINTS_COL)
    }

    // Row 53: ΣΥΝΟΛΟ label + SUM of the points column.
    // The row keeps its orange template styling; we just write the values.
    const totalRow = sheet.getRow(HIKING_CLIMBING_LAST_TEMPLATE_ROW)
    totalRow.getCell(HIKING_POINTS_COL - 1).value = 'ΣΥΝΟΛΟ'
    totalRow.getCell(HIKING_POINTS_COL).value = {
      formula: `SUM(L${DATA_START_ROW}:L${HIKING_CLIMBING_LAST_TEMPLATE_ROW - 1})`,
    }
    totalRow.commit()

    // The EOOA template contains stray formula/value cells outside the data
    // columns that produce visible artefacts (e.g. "1") in the exported file.
    // Explicitly nullify them so the output is clean.
    for (const ref of ['N16', 'N28', 'N36', 'O33', 'P33']) {
      sheet.getCell(ref).value = null
    }
  }

  /**
   * Sheet "2.ΑΝΑΡΡΙΧΗΣΗ" — Rock Climbing
   *
   * Column layout (1-based):
   *   A(1)  Α/Α                row number
   *   B(2)  ΗΜΕΡ/ΝΙΑ           date
   *   C(3)  ΒΟΥΝΟ              mountainOrArea
   *   D(4)  ΠΕΔΙΟ              climbingField
   *   E(5)  ΔΙΑΔΡΟΜΗ           routeName
   *   F(6)  ΕΠΟΧΗ              season  → Greek label
   *   G(7)  ΕΠΑΝ./ΝΕΑ          repetitionType → Greek label
   *   H(8)  ΥΨΟΜ.              altitude
   *   I(9)  ΒΔ(UIAA/Alpine)    mappedGrade ?? difficultyGrade, or "Επιλογή" if missing
   *   J(10) ΒΔ (Μεικτό/WI)    mixedClimbing, or "Επιλογή" if missing
   *   K(11) ΑΝΑΠΤ.             routeLength
   *   L(12) ΑΤΟΜΑ              participantsNum
   *   M(13) ΣΥΜ/ΝΤΕΣ           participantsText
   *   N(14) ΒΑΘΜΟΙ             pre-calculated points (overrides template formula)
   *
   * completionType is intentionally NOT exported (not in the EOOA template).
   */
  private fillClimbingSheet(wb: ExcelJS.Workbook, activities: ActivityWithDetails[]): void {
    const sheet = wb.getWorksheet('2.ΑΝΑΡΡΙΧΗΣΗ')
    if (!sheet) return

    activities.forEach((act, i) => {
      const rowNum = DATA_START_ROW + i
      const d = act.climbingDetail!
      const row = sheet.getRow(rowNum)

      if (rowNum > HIKING_CLIMBING_LAST_TEMPLATE_ROW) {
        copyRowStyle(sheet, HIKING_CLIMBING_LAST_TEMPLATE_ROW, row)
      }

      // ΒΔ(UIAA/Alpine): use mappedGrade if French resolved, else difficultyGrade.
      // "Επιλογή" when no regular difficulty is present (only mixed/ice activity).
      const regularGrade: string = d.mappedGrade ?? d.difficultyGrade ?? EPILOGI

      // ΒΔ(Μεικτό/WI): the mixed grade, or "Επιλογή" if no mixed component.
      const mixedGrade: string = d.mixedClimbing ?? EPILOGI

      row.getCell(1).value = i + 1
      row.getCell(2).value = formatDate(act.date)
      row.getCell(3).value = d.mountainOrArea
      row.getCell(4).value = d.climbingField
      row.getCell(5).value = d.routeName
      row.getCell(6).value =
        CLIMBING_SEASON_EXCEL_LABELS[d.season as keyof typeof CLIMBING_SEASON_EXCEL_LABELS] ??
        d.season
      row.getCell(7).value =
        CLIMBING_REPETITION_EXCEL_LABELS[
          d.repetitionType as keyof typeof CLIMBING_REPETITION_EXCEL_LABELS
        ] ?? d.repetitionType
      row.getCell(8).value = d.altitude
      row.getCell(9).value = regularGrade
      row.getCell(10).value = mixedGrade
      row.getCell(11).value = Number(d.routeLength)
      row.getCell(12).value = d.participantsNum
      const ownName = `${act.user.firstName} ${act.user.lastName}`
      const partners = d.participantsText?.trim()
      row.getCell(13).value = partners ? `${ownName}, ${partners}` : ownName
      row.getCell(CLIMBING_POINTS_COL).value =
        act.points !== null ? Number(act.points) : null

      row.commit()
    })

    // Clear unused pre-formatted rows (stop before the ΣΥΝΟΛΟ row at row 53).
    for (
      let r = DATA_START_ROW + activities.length;
      r < HIKING_CLIMBING_LAST_TEMPLATE_ROW;
      r++
    ) {
      clearDataRow(sheet, r, CLIMBING_POINTS_COL)
    }

    // Row 53: ΣΥΝΟΛΟ label in col M (13) + SUM of points in col N (14).
    const totalRow = sheet.getRow(HIKING_CLIMBING_LAST_TEMPLATE_ROW)
    totalRow.getCell(CLIMBING_POINTS_COL - 1).value = 'ΣΥΝΟΛΟ'
    totalRow.getCell(CLIMBING_POINTS_COL).value = {
      formula: `SUM(N${DATA_START_ROW}:N${HIKING_CLIMBING_LAST_TEMPLATE_ROW - 1})`,
    }
    totalRow.commit()
  }

  /**
   * Sheet "3.ΑΠΟΣΤΟΛΕΣ ΕΞΩΤΕΡΙΚΟΥ" — Expeditions Abroad
   *
   * Column layout (1-based):
   *   A(1)  Α/Α          row number
   *   B(2)  ΗΜΕΡ/ΝΙΑ     date
   *   C(3)  ΧΩΡΑ         country
   *   D(4)  ΟΡΟΣΕΙΡΑ     mountainRange
   *   E(5)  ΒΟΥΝΟ        mountain
   *   F(6)  ΚΟΡΥΦΗ       summit
   *   G(7)  ΔΙΑΔΡΟΜΗ     routeName
   *   H(8)  ΕΠΟΧΗ        season → Greek label
   *   I(9)  ΥΨΟΜ.        altitude
   *   J(10) ΣΥΑ          totalElevationGain
   *   K(11) ΒΔ           difficultyGrade → Greek label
   *   L(12) ΑΤΟΜΑ        participantsNum
   *   M(13) ΟΡΓΑΝΩΣΗ     organizationType → Greek label
   *   N(14) ΒΑΘΜΟΙ       pre-calculated points (overrides template formula)
   */
  private fillExpeditionSheet(wb: ExcelJS.Workbook, activities: ActivityWithDetails[]): void {
    const sheet = wb.getWorksheet('3.ΑΠΟΣΤΟΛΕΣ ΕΞΩΤΕΡΙΚΟΥ')
    if (!sheet) return

    activities.forEach((act, i) => {
      const rowNum = DATA_START_ROW + i
      const d = act.expeditionDetail!
      const row = sheet.getRow(rowNum)

      if (rowNum > EXPEDITION_LAST_TEMPLATE_ROW) {
        copyRowStyle(sheet, EXPEDITION_LAST_TEMPLATE_ROW, row)
      }

      row.getCell(1).value = i + 1
      row.getCell(2).value = formatDate(act.date)
      row.getCell(3).value = d.country
      row.getCell(4).value = d.mountainRange
      row.getCell(5).value = d.mountain
      row.getCell(6).value = d.summit
      row.getCell(7).value = d.routeName
      row.getCell(8).value =
        EXPEDITION_SEASON_EXCEL_LABELS[d.season as keyof typeof EXPEDITION_SEASON_EXCEL_LABELS] ??
        d.season
      row.getCell(9).value = d.altitude
      row.getCell(10).value = d.totalElevationGain
      row.getCell(11).value =
        EXPEDITION_DIFFICULTY_EXCEL_LABELS[
          d.difficultyGrade as keyof typeof EXPEDITION_DIFFICULTY_EXCEL_LABELS
        ] ?? d.difficultyGrade
      row.getCell(12).value = d.participantsNum
      row.getCell(13).value =
        EXPEDITION_ORGANIZATION_EXCEL_LABELS[
          d.organizationType as keyof typeof EXPEDITION_ORGANIZATION_EXCEL_LABELS
        ] ?? d.organizationType
      row.getCell(EXPEDITION_POINTS_COL).value =
        act.points !== null ? Number(act.points) : null

      row.commit()
    })

    for (
      let r = DATA_START_ROW + activities.length;
      r <= EXPEDITION_LAST_TEMPLATE_ROW;
      r++
    ) {
      clearDataRow(sheet, r, EXPEDITION_POINTS_COL)
    }

    // Nullify stray template cells outside the data columns.
    for (const ref of ['P28']) {
      sheet.getCell(ref).value = null
    }
  }
}
