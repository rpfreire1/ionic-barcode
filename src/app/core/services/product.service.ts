import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {Product} from "../types/product.type";


@Injectable(
  {
    providedIn:'root'
  }
)
export class ProductService{
  private readonly URL_BASIC:string='http://186.4.137.197:9090/api/v1/product'

  constructor(private httpClient:HttpClient) {
  }

  getProductByBarCode(
    barCode:string
  ):Observable<Product>{
    return this.httpClient.get<Product>(`${this.URL_BASIC}/${barCode}`)
  }

  updateProductStockByCode(
    barCode:string,
    newStock:number
  ):Observable<Product>{

    const body:string='';
    return this.httpClient.put<Product>(`${this.URL_BASIC}/${barCode}?stock=${newStock}`,body)

  }
}
