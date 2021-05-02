import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import React, { lazy, Suspense, useMemo } from "react";
import useSWR from "swr";

import { careSummary } from "../../utils/api";
import { OXYGEN_TYPES } from "../../utils/constants";
import {
  dateString,
  getNDateAfter,
  getNDateBefore,
  processFacilities,
} from "../../utils/utils";
import { InfoCard } from "../Cards/InfoCard";
import { ValuePill } from "../Pill/ValuePill";
import ThemedSuspense from "../ThemedSuspense";

const FacilityTable = lazy(() => import("./FacilityTable"));
dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);


function ItemDiv({ arr }) {
  // console.log(arr)
  let a = [[], [], [], [], [], []]
  arr.forEach((item) => {
    item.forEach((c, i) => {
      a[i].push(<p className="text-xxs dark:text-gray-400 text-gray-600 xl:text-xs">{c}</p>)
    })
  })
  return a
}

function OxygenMonitor({ filterDistrict, filterFacilityTypes, date }) {
  const { data } = useSWR(
    ["OxygenMonitor", date, filterDistrict.id],
    (url, date, district) =>
      careSummary(
        "facility",
        dateString(getNDateBefore(date, 1)),
        dateString(getNDateAfter(date, 1)),
        district
      )
  );
  const { tableData } = useMemo(() => {
    const filtered = processFacilities(data.results, filterFacilityTypes);
    // const facilitiesTrivia = filtered.reduce(
    //   (a, c) => {
    //     const key = c.date === dateString(date) ? "current" : "previous";
    //     a[key].count += 1;
    //     Object.keys(TRIAGE_TYPES).forEach((k) => {
    //       a[key][k] += c[k];
    //       a[key][k] += c[k];
    //     });
    //     return a;
    //   },
    //   {
    //     current: JSON.parse(JSON.stringify(initialFacilitiesTrivia)),
    //     previous: JSON.parse(JSON.stringify(initialFacilitiesTrivia)),
    //   }
    // );
    // console.log(filtered)
    const tableData = filtered.reduce((a, c) => {
      if (c.date === dateString(date)) {
        if (c.inventory && Object.keys(c.inventory).length !== 0) {
          const arr = Object.keys(c.inventory).map((k) => {
            const data = c.inventory[k]
            return [
              data.item_name, data.stock, data.burn_rate == null ? '-' : data.burn_rate, data.is_low ? "Yes" : "No", data.unit]
          })
          return [
            ...a,
            [[c.name, c.facilityType, c.phoneNumber],
            ...ItemDiv({ arr })
            ]
          ]
        } return a;
      } return a;
    }, []);
    /*   const exported = {
        filename: "triage_export.csv",
        data: filtered.reduce((a, c) => {
          if (c.date !== dateString(date)) {
            return a;
          }
          return [
            ...a,
            {
              "Hospital/CFLTC Name": c.name,
              "Hospital/CFLTC Address": c.address,
              "Govt/Pvt": c.facilityType.startsWith("Govt") ? "Govt" : "Pvt",
              "Hops/CFLTC":
                c.facilityType === "First Line Treatment Centre"
                  ? "CFLTC"
                  : "Hops",
              Mobile: c.phoneNumber,
              ...Object.keys(TRIAGE_TYPES).reduce((t, x) => {
                const y = { ...t };
                y[TRIAGE_TYPES[x]] = c[x] || 0;
                return y;
               }, {}),
            },
          ];
        }, []),
      }; */
    // console.log(tableData)
    return { tableData };
  }, [data, filterFacilityTypes]);

  return (
    <>
      {/* <div className="grid gap-1 grid-rows-none mb-8 sm:grid-flow-col-dense sm:grid-rows-1 sm:place-content-end">
        <ValuePill
          title="Facility Count"
          value={facilitiesTrivia.current.count}
        />
      </div> */}
      {/*  <div className="grid-col-1 grid gap-6 mb-8 md:grid-cols-4">
        {Object.keys(TRIAGE_TYPES).map((k, i) => {
          if (k !== "total_patients") {
            return (
              <InfoCard
                key={i}
                title={TRIAGE_TYPES[k]}
                value={facilitiesTrivia.current[k]}
                delta={
                  facilitiesTrivia.current[k] - facilitiesTrivia.previous[k]
                }
              />
            );
          }
        })}
      </div> */}
      <Suspense fallback={<ThemedSuspense />}>
        <FacilityTable
          className="mb-8"
          columns={[
            "Name",
            ...OXYGEN_TYPES,
          ]}
          data={tableData}
        // exported={exported}
        />
      </Suspense>
    </>
  );
}

export default OxygenMonitor;
