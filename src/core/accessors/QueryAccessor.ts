import {BaseQueryAccessor} from "./BaseQueryAccessor";
import {
  MultiMatchQuery,
  BoolShould,
  SimpleQueryString
} from "../query";

const assign = require("lodash/assign")

export interface SearchOptions {
  queryFields?:Array<string>
  queryOptions?:any
  prefixQueryFields?:Array<string>
  prefixQueryOptions?:Object
  title?: string
  addToFilters?:boolean
  queryBuilder?:Function
  onChange?:Function
}
export class QueryAccessor extends BaseQueryAccessor {
  options:SearchOptions

  constructor(key, options={}){
    super(key)
    this.options = options
    this.options.queryFields = this.options.queryFields || ["_all"]
  }
  
  onStateChange(oldState={}){
    console.log("onStateChange")
    if (this.options.onChange){
      this.options.onChange()
    }
  }

  buildSharedQuery(query){
    let queryStr = this.state.getValue()
    if(queryStr){
      let queryBuilder  = this.options.queryBuilder || SimpleQueryString
      let simpleQuery = queryBuilder(
        queryStr, assign(
          {fields:this.options.queryFields},
          this.options.queryOptions
        )
      )

      let queries:Array<any> = [simpleQuery]

      if (this.options.prefixQueryFields) {
        queries.push(MultiMatchQuery(queryStr, assign(
          this.options.prefixQueryOptions, {
            type:"phrase_prefix",
            fields:this.options.prefixQueryFields,
          }
        )))
      }
      query = query.addQuery(BoolShould(queries))

      if (this.options.addToFilters){
        query = query.addSelectedFilter({
          name: this.options.title,
          value: queryStr,
          id: this.key,
          remove: () => this.state = this.state.clear()
        })
      } else {
        query = query.setQueryString(queryStr)
      }

      return query
    }
    return query

  }

}
